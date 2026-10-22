const ANSI = {
  clearDown: '\u001b[J',
  cyanGray: '\u001b[46;90m',
  green: '\u001b[32m',
  hideCursor: '\u001b[?25l',
  modeDeleted: '\u001b[1;31m',
  modeModified: '\u001b[1;33m',
  modeUpdated: '\u001b[1;32m',
  purple: '\u001b[35m',
  redGray: '\u001b[41;90m',
  reset: '\u001b[0m',
  showCursor: '\u001b[?25h',
  yellow: '\u001b[33m',
};

const defaultSchedule = (callback) => setTimeout(callback, 50);

const sourceLabel = (value) => {
  const url = new URL(value);
  return `${url.hostname}/${url.pathname.split('/').filter(Boolean).slice(0, 2).join('/')}`;
};

const errorMessage = (error) =>
  String(error?.message || error).replace(/\s+/g, ' ').trim();

const formatDuration = (durationMs) =>
  durationMs < 1_000
    ? `${durationMs}ms`
    : `${(durationMs / 1_000).toFixed(1)}s`;

const formatFiles = (fileCount) =>
  `${fileCount} file${fileCount === 1 ? '' : 's'}`;

const truncate = (value, width) =>
  value.length <= width
    ? value
    : `${value.slice(0, Math.max(0, width - 1))}…`;

const paint = (enabled, color, value) =>
  enabled ? `${color}${value}${ANSI.reset}` : value;

const isFileDetail = (detail) =>
  detail &&
  typeof detail === 'object' &&
  typeof detail.mode === 'string' &&
  typeof detail.path === 'string';

const plainDetail = (detail) =>
  isFileDetail(detail) ? `${detail.mode} ${detail.path}` : detail;

const itemName = (source) => {
  const name = source.name ?? source.skill ?? source.rule;
  if (!name) {
    throw new Error('Upgrade reporter requires a skill, rule, or name');
  }
  return name;
};

const createPlainReporter = (states, stream, now) => {
  const write = (name, message) => stream.write(`[${name}] ${message}\n`);

  return {
    start(name) {
      const state = states.get(name);
      state.startedAt = now();
      write(name, `RUN  ${state.source}`);
    },
    detail(name, message) {
      write(name, plainDetail(message));
    },
    pass(name, { durationMs, fileCount }) {
      write(
        name,
        `PASS Done in ${formatDuration(durationMs)} · ${formatFiles(fileCount)}`,
      );
    },
    fail(name, error) {
      const state = states.get(name);
      write(
        name,
        `FAIL Failed in ${formatDuration(now() - state.startedAt)} · ${errorMessage(error)}`,
      );
    },
    finish() {},
  };
};

const createTtyReporter = (
  states,
  stream,
  now,
  schedule,
  cancel,
  color,
) => {
  let scheduledRender;
  let renderedLineCount = 0;
  let finished = false;

  const liveDetailLimit = Math.max(
    1,
    Math.floor((Math.max(stream.rows || 24, 8) - states.size) / states.size) -
      3,
  );

  const formatPanel = (state) => {
    const width = Math.max(stream.columns || 80, 20);
    const badge = ` ${state.status.padEnd(4)} `;
    const badgeColor = state.status === 'FAIL' ? ANSI.redGray : ANSI.cyanGray;
    const source = truncate(state.source, width - badge.length - 3);
    const formatDetail = (detail) => {
      if (!isFileDetail(detail)) {
        return `${paint(color, ANSI.purple, '│')} ${truncate(detail, width - 2)}`;
      }

      const modeColor = {
        U: ANSI.modeUpdated,
        M: ANSI.modeModified,
        D: ANSI.modeDeleted,
      }[detail.mode];
      return (
        `${paint(color, ANSI.purple, '│')} ` +
        `${paint(color, modeColor, detail.mode)} ` +
        truncate(detail.path, width - 4)
      );
    };
    // Live updates may roll; finished panels keep every file change.
    const visibleDetails =
      state.status === 'PASS' || state.status === 'FAIL' || finished
        ? state.details
        : state.details.slice(-liveDetailLimit);
    const lines = [
      paint(color, ANSI.green, truncate(state.name, width)),
      `${paint(color, ANSI.purple, '│')} ${paint(color, badgeColor, badge)} ${paint(color, ANSI.yellow, source)}`,
      ...visibleDetails.map(formatDetail),
    ];

    let footer;
    if (state.status === 'PASS') {
      footer =
        `└ Done in ${formatDuration(state.durationMs)} · ` +
        formatFiles(state.fileCount);
    } else if (state.status === 'FAIL') {
      footer =
        `└ Failed in ${formatDuration(state.durationMs)} · ${state.error}`;
    } else {
      footer = `└ Running... ${formatFiles(state.fileCount)}`;
    }

    lines.push(paint(color, ANSI.purple, truncate(footer, width)));
    return lines;
  };

  const render = () => {
    scheduledRender = undefined;
    const lines = [...states.values()].flatMap((state, index) => [
      ...formatPanel(state),
      ...(index === states.size - 1 ? [] : ['']),
    ]);
    const prefix =
      renderedLineCount > 0
        ? `\u001b[${renderedLineCount}F${ANSI.clearDown}`
        : '';

    stream.write(`${prefix}${lines.join('\n')}\n`);
    renderedLineCount = lines.length;
  };

  const requestRender = () => {
    if (!scheduledRender && !finished) {
      scheduledRender = schedule(render);
    }
  };

  const update = (name, updater) => {
    updater(states.get(name));
    requestRender();
  };

  stream.write(ANSI.hideCursor);

  return {
    start(name) {
      update(name, (state) => {
        state.status = 'RUN';
        state.startedAt = now();
      });
    },
    detail(name, message) {
      update(name, (state) => {
        state.details.push(message);
        state.fileCount += 1;
      });
    },
    pass(name, { durationMs, fileCount }) {
      update(name, (state) => {
        state.status = 'PASS';
        state.durationMs = durationMs;
        state.fileCount = fileCount;
      });
    },
    fail(name, error) {
      update(name, (state) => {
        state.status = 'FAIL';
        state.durationMs = now() - state.startedAt;
        state.error = errorMessage(error);
      });
    },
    finish() {
      if (finished) {
        return;
      }
      finished = true;
      if (scheduledRender) {
        cancel(scheduledRender);
        scheduledRender = undefined;
      }
      render();
      stream.write(ANSI.showCursor);
    },
  };
};

/**
 * 为并行升级创建报告器。条目用 `name`、`skill` 或 `rule` 标识，来源取配置里的 `repo`。
 *
 * @param {{ name?: string, skill?: string, rule?: string, repo: string }[]} sources
 * @param {{
 *   stream?: NodeJS.WriteStream,
 *   now?: () => number,
 *   schedule?: (callback: () => void) => unknown,
 *   cancel?: (token: unknown) => void,
 *   color?: boolean,
 * }} options
 */
export const createUpgradeReporter = (
  sources,
  {
    stream = process.stdout,
    now = Date.now,
    schedule = defaultSchedule,
    cancel = clearTimeout,
    color = process.env.NO_COLOR === undefined,
  } = {},
) => {
  const states = new Map(
    sources.map((source) => {
      const name = itemName(source);
      return [
        name,
        {
          name,
          source: sourceLabel(source.repo),
          status: 'WAIT',
          startedAt: now(),
          durationMs: 0,
          fileCount: 0,
          details: [],
          error: '',
        },
      ];
    }),
  );

  return stream.isTTY
    ? createTtyReporter(states, stream, now, schedule, cancel, color)
    : createPlainReporter(states, stream, now);
};
