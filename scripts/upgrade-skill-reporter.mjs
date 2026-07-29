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

const createPlainReporter = (states, stream, now) => {
  const write = (skill, message) => stream.write(`[${skill}] ${message}\n`);

  return {
    start(skill) {
      const state = states.get(skill);
      state.startedAt = now();
      write(skill, `RUN  ${state.source}`);
    },
    detail(skill, message) {
      write(skill, plainDetail(message));
    },
    pass(skill, { durationMs, fileCount }) {
      write(
        skill,
        `PASS Done in ${formatDuration(durationMs)} · ${formatFiles(fileCount)}`,
      );
    },
    fail(skill, error) {
      const state = states.get(skill);
      write(
        skill,
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

  const detailLimit = Math.max(
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
    const lines = [
      paint(color, ANSI.green, truncate(state.skill, width)),
      `${paint(color, ANSI.purple, '│')} ${paint(color, badgeColor, badge)} ${paint(color, ANSI.yellow, source)}`,
      ...state.details.slice(-detailLimit).map(formatDetail),
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

  const update = (skill, updater) => {
    updater(states.get(skill));
    requestRender();
  };

  stream.write(ANSI.hideCursor);

  return {
    start(skill) {
      update(skill, (state) => {
        state.status = 'RUN';
        state.startedAt = now();
      });
    },
    detail(skill, message) {
      update(skill, (state) => {
        state.details.push(message);
        state.fileCount += 1;
      });
    },
    pass(skill, { durationMs, fileCount }) {
      update(skill, (state) => {
        state.status = 'PASS';
        state.durationMs = durationMs;
        state.fileCount = fileCount;
      });
    },
    fail(skill, error) {
      update(skill, (state) => {
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
 * Create a reporter for concurrent skill upgrades.
 *
 * @param {{ skill: string, url: string }[]} sources
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
    sources.map(({ skill, url }) => [
      skill,
      {
        skill,
        source: sourceLabel(url),
        status: 'WAIT',
        startedAt: now(),
        durationMs: 0,
        fileCount: 0,
        details: [],
        error: '',
      },
    ]),
  );

  return stream.isTTY
    ? createTtyReporter(states, stream, now, schedule, cancel, color)
    : createPlainReporter(states, stream, now);
};
