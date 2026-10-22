# Java 编写缺省

只在 coding-common Step 3 且改动触及 `.java` 时读取。与目标文件相邻代码冲突的条目不要套用。通用不可变、错误传递、文件长度等仍以 coding-common 的 `style.md` 为准。语法不超过 SKILL.md 里的发行版表。

## 文件与命名

- 一个源文件一个 public 顶层类型。嵌套类型可以留在同一文件。
- 缩进跟随相邻文件（2 或 4 个空格）。仓库已有格式化命令时用该命令。
- 成员顺序：常量、字段、构造器、public 方法、protected 方法、private 方法。
- 类、接口、record、enum 用 PascalCase。方法、字段、参数、局部变量用 camelCase。`static final` 常量用 SCREAMING_SNAKE_CASE。
- 访问器是 `id()` 还是 `getId()`，跟随相邻类型。
- 包名全小写。已有包结构保持不动。

## 值对象

发行版允许、且相邻代码没有另一种 DTO 写法时，值对象用 record。否则用 `final` 字段，不写 setter。

持久化实体、以及框架要求无参构造或可变生命周期的类型，跟随相邻实体，不改成 record。

公开方法返回集合时返回不可变副本：`List.copyOf`、`Map.copyOf`、`Set.copyOf`。调用方之后还要使用的对象，返回新实例。

```java
public record OrderSummary(Long id, String customerName, BigDecimal total) {}

public final class Order {
    private final Long id;
    private final List<LineItem> items;

    public Order(Long id, List<LineItem> items) {
        this.id = id;
        this.items = List.copyOf(items);
    }

    public List<LineItem> items() {
        return items;
    }
}
```

金额比较用 `compareTo`，不用 `equals`。

## Optional

按方法所在的层决定空结果的形状：

- 服务查找方法：用户要求明确失败，或相邻服务查找已经抛领域异常时，方法抛带标识的领域异常。该方法不返回 `Optional`，也不返回 `null`。
- 仓储查找方法：没有查到行是查询结果，返回 `Optional<T>`。服务方法用 `orElseThrow` 把它变成上面的领域异常。
- 没有结果也不是失败，调用方要自己处理空：返回 `Optional`，调用方用 `map` 或 `orElse`。

`Optional` 不用作字段类型或方法参数。不在未确认有值时调用 `get()`。

```java
public Order findById(Long id) {
    return repository.findById(id)
        .orElseThrow(() -> new OrderNotFoundException(id));
}
```

## 错误

领域失败用未检查异常，并带上标识。顶层入口之外不写 `catch (Exception e)`。异常类型与日志通道跟随仓库已有写法。

```java
public final class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(Long id) {
        super("Order not found: id=" + id);
    }
}
```

## 流与分支

转换用短流（大约不超过 4 步），优先方法引用，流里不做副作用。分支变复杂时用循环或提前返回。

发行版允许时，`instanceof` 用模式匹配，switch 用箭头表达式。封闭层次在发行版允许时用 sealed，并用穷尽 switch 处理。

```java
if (shape instanceof Circle c) {
    return Math.PI * c.radius() * c.radius();
}
```

## 边界校验

仓库已有校验注解时沿用。没有校验库时，在进入逻辑前用手写判断失败，信息能让调用方看出缺了哪一项。`String.isBlank` 需要发行版 11 及以上；更低时用相邻文件已有的空串判断。

```java
if (customerName == null || customerName.isBlank()) {
    throw new IllegalArgumentException("Customer name is required");
}
if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
    throw new IllegalArgumentException("Amount must be positive");
}
```

## 日志

生产路径不留调试打印。使用仓库已有的日志工具；没有时用现有错误通道，不新装日志框架。
