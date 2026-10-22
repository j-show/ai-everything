# Java 安全缺省

只在 coding-common Step 5（安全敏感改动）且触及 `.java` 时读取。通用清单仍以 coding-common 的 `security.md` 为准。

## 密钥

```java
String apiKey = System.getenv("PAYMENT_API_KEY");
Objects.requireNonNull(apiKey, "PAYMENT_API_KEY must be set");
```

- 必需密钥缺失时，在使用前失败。
- 回复、测试快照与日志中不写密钥、口令或令牌的值。
- 仓库已有密钥读取方式时沿用，不改成另一套环境变量约定。

## 查询

外部输入进入查询时使用参数绑定：`PreparedStatement`，或框架已有的参数化 API。标识符、排序字段和文件路径来自固定允许列表，不直接拼接用户字符串。

本次新建的 JDBC 连接、语句和结果集用 try-with-resources 关闭。相邻代码已经用同一种关闭写法时，跟随相邻代码。相邻代码没有关闭时，仍然关闭本次新建的资源，不把泄漏留在新语句里。

```java
try (PreparedStatement statement = connection.prepareStatement(
        "SELECT id, customer_name FROM orders WHERE customer_name = ?")) {
    statement.setString(1, customerName);
}
```

## 输入、口令与错误响应

- 系统边界上的 DTO 沿用仓库已有的校验注解。没有校验库时按 `style.md` 手写判断。
- 受保护操作在服务边界检查身份和权限，组件跟随仓库已有实现。
- 口令存储跟随仓库已有算法。仓库没有口令存储时，不新装加密库，也不手写摘要。
- 日志不写口令、令牌或个人敏感字段。
- 返回给调用方的消息是稳定的、不含堆栈、SQL、内部路径或 `getMessage()` 原文。细节只进服务端日志。

## 语言层补充核对

在 coding-common 安全清单之外，再核对本次 Java diff：

- [ ] 没有把密钥写进源码、测试或配置样例字面量
- [ ] 来自 `System.getenv` 或仓库密钥 API 的必需配置在使用前已校验存在
- [ ] SQL 与原生查询使用参数绑定
- [ ] 本次新建的 JDBC 连接、语句和结果集已关闭
- [ ] 对外错误不含堆栈、查询文本或内部路径
