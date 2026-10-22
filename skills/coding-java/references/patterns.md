# Java 缺省形状

只在 coding-common Step 3、仓库尚无同类形状、且需要新建数据访问边界、应用服务或对外响应类型时读取。仓库已有形状时忽略本节。

## 仓储

```java
public interface OrderRepository {
    Optional<Order> findById(Long id);
    Order save(Order order);
}
```

业务代码依赖这个接口。JDBC、内存实现或仓库已有的持久化技术只出现在实现类里。方法名跟随相邻仓储，不把上面两个方法名套到已有接口上。

这里的 `Optional` 只表示仓储没有查到行。服务查找方法在明确失败时抛领域异常，不把 `Optional` 写进服务方法的返回类型。

## 服务与构造器注入

新的服务通过构造器接收依赖，字段为 `final`。同目录已经使用字段注入时跟随同目录，并在完成说明点明。

```java
public final class OrderService {
    private final OrderRepository orders;

    public OrderService(OrderRepository orders) {
        this.orders = orders;
    }

    public Order place(CreateOrderRequest request) {
        Order order = Order.from(request);
        return orders.save(order);
    }
}
```

单个构造器是否再加注入注解，跟随相邻类。

## 边界类型

发行版允许时，请求和响应用 record，并在边界上提供转换。字段名跟随相邻 DTO。

```java
public record OrderResponse(Long id, String customer, BigDecimal total) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(order.id(), order.customerName(), order.total());
    }
}
```

封闭的结果类型在发行版允许、且调用方需要穷尽处理时用 sealed。可选字段很多时，跟随相邻构建器；没有构建器时，用必填字段明确的 record 或类，不为此新增代码生成库。

## 响应信封

仅当仓库还没有统一响应形状、且本次要新增对外 HTTP 边界时，才使用下面的形状。已有信封的字段名与可选性保持不变。

```java
public record ApiResponse<T>(boolean success, T data, String error) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
```
