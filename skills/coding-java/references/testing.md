# Java 测试缺省

只在 coding-common Step 4 且改动触及 `.java` 时读取。测试先行顺序、覆盖率门槛与失败排查仍以 coding-common 的 `testing.md` 为准。

## 框架与位置

- 使用仓库已有的测试运行器、断言库和 mock 库。
- 测试包路径镜像被测类。命名、`@DisplayName` 与 import 跟随相邻测试。
- 仓库已有 JUnit 5 时，用其 `@Test`、`@ParameterizedTest`、`@CsvSource`、`@Nested`、`@BeforeEach`。
- 仓库已有 AssertJ 时，用 `assertThat` / `assertThatThrownBy`。金额用比较断言，不用 `equals`。
- 仓库已有 Mockito 时，用相邻测试同一套扩展来创建 mock，再把 mock 传入构造器。常见写法是 `org.mockito.junit.jupiter.MockitoExtension` 加上 `@Mock`、`when` / `thenReturn`。

仓库没有这些库时，不安装。行为变更仍按 coding-common 处理；没有可运行的测试命令时，在完成说明写明未验证的行为。

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository);
    }

    @Test
    @DisplayName("findById returns the order when it exists")
    void findById_existingOrder_returnsOrder() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(new Order(1L, "Alice")));

        Order result = orderService.findById(1L);

        assertThat(result.customerName()).isEqualTo("Alice");
    }
}
```

多组输入且仓库已有 `@ParameterizedTest` 时，用 `@CsvSource` 列出输入和期望，不复制多份几乎相同的测试方法。

## 集成与覆盖率

仓库已经使用 Testcontainers（或其他集成夹具）时，需要真实依赖的测试跟随现有容器镜像、生命周期和目录。仓库没有时，不安装 Testcontainers，也不新增数据库来满足本技能。

仓库有编译或测试命令时（例如 `./mvnw test`、`mvn test`、`./gradlew test`，或包脚本里已有的等价命令），运行与本次改动相关的命令，并记录退出状态。

项目已有覆盖率命令时，门槛仍以 coding-common 为准。没有 JaCoCo 或等价命令时，报告“未测量”，不安装覆盖率插件。
