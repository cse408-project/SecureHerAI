# SecureHerAI API Testing Guide

## Overview

This document describes the comprehensive testing strategy and implementation for the SecureHerAI API backend. The testing suite follows Spring Boot best practices and includes unit tests, integration tests, and code coverage reporting.

## Testing Stack

### Core Testing Framework

- **JUnit 5** - Modern testing framework with improved assertions and parameterized tests
- **Mockito** - Mocking framework for unit tests
- **Spring Boot Test** - Testing support for Spring Boot applications
- **TestContainers** - Integration testing with real databases

### Test Types

#### 1. Unit Tests

- **Location**: `src/test/java/`
- **Pattern**: `*Test.java`
- **Purpose**: Test individual components in isolation
- **Examples**:
  - `UserServiceTest.java` - Tests business logic
  - `JwtServiceTest.java` - Tests JWT operations
  - `AuthServiceTest.java` - Tests authentication logic

#### 2. Integration Tests

- **Location**: `src/test/java/*/integration/`
- **Pattern**: `*IntegrationTest.java` or `*IT.java`
- **Purpose**: Test component interactions and real database operations
- **Examples**:
  - `AuthIntegrationTest.java` - End-to-end authentication flow

#### 3. Repository Tests

- **Annotation**: `@DataJpaTest`
- **Purpose**: Test JPA repositories with embedded database
- **Examples**:
  - `UserRepositoryTest.java` - Tests database operations

#### 4. Controller Tests

- **Annotation**: `@WebMvcTest`
- **Purpose**: Test REST endpoints with MockMvc
- **Examples**:
  - `UserControllerTest.java` - Tests HTTP endpoints
  - `AuthControllerTest.java` - Tests authentication endpoints

## Testing Annotations

### Spring Boot Testing Annotations

```java
@SpringBootTest              // Full application context
@WebMvcTest                  // Web layer only
@DataJpaTest                 // JPA repositories only
@MockBean                    // Mock Spring beans
@TestPropertySource          // Override properties for tests
@ActiveProfiles("test")      // Use test profile
@Transactional              // Rollback after each test
```

### JUnit 5 Annotations

```java
@ExtendWith(MockitoExtension.class)  // Enable Mockito
@BeforeEach                          // Setup before each test
@Test                               // Test method
@ParameterizedTest                  // Multiple test inputs
@DisplayName                        // Test description
```

## Test Configuration

### Test Profiles

#### `application-test.properties`

- H2 in-memory database
- Disabled email service
- Debug logging enabled

#### `application-integration-test.properties`

- PostgreSQL with TestContainers
- Real database operations
- Production-like configuration

### Test Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

## Running Tests

### Maven Commands

```bash
# Run all unit tests
mvn test

# Run integration tests
mvn verify

# Run tests with coverage
mvn clean test jacoco:report

# Run specific test class
mvn test -Dtest=UserServiceTest

# Run specific test method
mvn test -Dtest=UserServiceTest#getProfile_WhenUserExists_ReturnsUserProfile

# Skip tests
mvn install -DskipTests
```

### IDE Integration

- All tests can be run directly from IDE
- Use test profile: `-Dspring.profiles.active=test`
- Configure JVM options: `-Xmx1024m`

## Test Structure Examples

### Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void getProfile_WhenUserExists_ReturnsUserProfile() {
        // Arrange
        User user = TestDataUtil.createTestUser();
        when(userRepository.findById(any())).thenReturn(Optional.of(user));

        // Act
        Object result = userService.getProfile(user.getId());

        // Assert
        assertInstanceOf(AuthResponse.Profile.class, result);
        verify(userRepository).findById(user.getId());
    }
}
```

### Integration Test Example

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@Transactional
class AuthIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullRegistrationFlow_WithValidData_Success() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpected(status().isCreated());
    }
}
```

### Repository Test Example

```java
@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByEmail_WhenUserExists_ReturnsUser() {
        // Arrange
        User user = TestDataUtil.createTestUser();
        entityManager.persistAndFlush(user);

        // Act
        Optional<User> result = userRepository.findByEmail(user.getEmail());

        // Assert
        assertTrue(result.isPresent());
        assertEquals(user.getEmail(), result.get().getEmail());
    }
}
```

## Code Coverage

### JaCoCo Configuration

- Minimum coverage: 70%
- Reports generated in `target/site/jacoco/`
- Coverage checked during `mvn verify`

### Coverage Goals

- **Service Layer**: >80% coverage
- **Controller Layer**: >75% coverage
- **Repository Layer**: >70% coverage
- **Overall**: >70% coverage

## Best Practices

### Unit Testing

1. **Test Behavior, Not Implementation**

   - Focus on what the method does, not how
   - Test public interfaces, not private methods

2. **Use Descriptive Test Names**

   ```java
   // Good
   void getProfile_WhenUserNotFound_ReturnsError()

   // Bad
   void testGetProfile()
   ```

3. **Follow AAA Pattern**

   - **Arrange**: Set up test data
   - **Act**: Execute the method under test
   - **Assert**: Verify the results

4. **Mock External Dependencies**
   - Mock repositories, external services
   - Don't mock the class under test

### Integration Testing

1. **Use Real Database**

   - TestContainers for realistic testing
   - Test actual SQL queries and constraints

2. **Test Complete Workflows**

   - End-to-end user journeys
   - Cross-layer interactions

3. **Clean Up After Tests**
   - Use `@Transactional` for automatic rollback
   - Or explicit cleanup in `@AfterEach`

### Common Pitfalls

1. **Brittle Tests**: Don't assert on implementation details
2. **Slow Tests**: Keep unit tests fast, use mocks appropriately
3. **Flaky Tests**: Avoid time-dependent assertions
4. **Test Data Coupling**: Use factory methods for test data

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Tests
  run: mvn clean verify

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v3
  with:
    file: ./target/site/jacoco/jacoco.xml
```

### Quality Gates

- All tests must pass
- Code coverage must meet minimum threshold
- No security vulnerabilities in dependencies

## Troubleshooting

### Common Issues

1. **Tests fail in CI but pass locally**

   - Check timezone settings
   - Verify test isolation
   - Check for race conditions

2. **Database connection issues**

   - Ensure TestContainers is properly configured
   - Check Docker daemon is running

3. **MockBean not working**
   - Verify `@MockBean` is used in Spring context
   - Check if bean exists in application context

### Debug Tips

- Use `@Sql` to load test data
- Enable SQL logging: `spring.jpa.show-sql=true`
- Use `@DirtiesContext` for problematic tests
- Add `@TestMethodOrder` for ordered tests

## Future Enhancements

1. **Performance Testing**

   - JMeter integration
   - Load testing scenarios

2. **Contract Testing**

   - Spring Cloud Contract
   - API contract verification

3. **Security Testing**

   - OWASP ZAP integration
   - Security-focused test scenarios

4. **Mutation Testing**
   - PIT mutation testing
   - Test quality verification
