# Testing Documentation

This project uses Jest with TypeScript for comprehensive testing of the ultrasound focusing animation system.

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode (for development)
npm test -- --watch

# Run specific test file
npm test arrayElement.test.ts
```

## Test Structure

### Test Files

- `src/arrayElement.test.ts` - Tests for the `ArrayElement` class
- `src/frameGeneration.test.ts` - Tests for frame generation functions
- `src/setupTests.ts` - Test environment setup and mocking

### Test Categories

#### ArrayElement Tests
- **Constructor tests**: Verify proper initialization with default and custom parameters
- **Basic drawing tests**: Ensure main element circle and trigger line are always drawn
- **Pre-delay phase tests**: Verify red pulse animation before delay time
- **Post-delay phase tests**: Verify wave propagation after delay time
- **Edge case tests**: Handle zero delay, negative time, different positions
- **Physics tests**: Verify correct speed of sound calculations

#### Frame Generation Tests
- **Core function tests**: Test `drawElementsAtTime` with single and multiple elements
- **Frame creation tests**: Test complete frame generation with proper canvas clearing and text
- **Integration tests**: Verify complete workflow from parameters to rendered frame
- **Extensibility tests**: Ensure architecture supports future multi-element arrays

## Test Configuration

### Jest Setup
- **Environment**: jsdom (for browser API simulation)
- **Preset**: ts-jest with ESM support
- **Coverage**: 100% statement, branch, function, and line coverage
- **Mocking**: Canvas APIs, ImageBitmap, and other browser-specific features

### Key Mocks
- `createImageBitmap()` - Returns mock ImageBitmap objects
- `HTMLCanvasElement.toBlob()` - Simulates canvas-to-blob conversion
- Canvas 2D context methods - Full mock of drawing operations
- `URL.createObjectURL/revokeObjectURL` - File handling simulation

## Test Philosophy

### What We Test
1. **Core Animation Logic**: Both pre-delay red pulse and post-delay wave propagation
2. **Physics Calculations**: Speed of sound, timing, and distance calculations
3. **Canvas Operations**: Proper drawing sequences and parameters
4. **Edge Cases**: Boundary conditions, invalid inputs, and error states
5. **Future Extensibility**: Multi-element architecture readiness

### What We Don't Test
- DOM manipulation in `main.ts` (excluded from coverage)
- Browser-specific rendering behavior
- Actual visual output (we test drawing commands, not pixels)

## Coverage Requirements

- **Minimum**: 95% coverage on all metrics
- **Current**: 100% coverage achieved
- **Focus**: Critical animation logic and physics calculations

## Development Workflow

1. **Write failing test** for new functionality
2. **Implement minimum code** to pass the test
3. **Refactor** while maintaining green tests
4. **Verify coverage** remains high

## Testing Best Practices

### Mocking Strategy
- Mock at the boundary (Canvas APIs, not internal logic)
- Use spies to verify method calls and parameters
- Avoid testing implementation details, focus on behavior

### Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names that explain the scenario
- Test one concept per test function
- Use `beforeEach` for common setup

### Assertions
- Test both positive and negative cases
- Verify method calls with exact parameters where important
- Use type-safe expectations
- Test edge cases and boundary conditions

## Extending Tests

When adding new features:

1. **Add constructor tests** for new parameters
2. **Add drawing tests** for new visual elements
3. **Add physics tests** for new calculations
4. **Add integration tests** for complete workflows
5. **Update coverage requirements** if needed

## Troubleshooting

### Common Issues
- **ESM import errors**: Check `tsconfig.test.json` configuration
- **Canvas mock failures**: Verify `setupTests.ts` is loaded
- **Type errors**: Ensure `@types/jest` is installed
- **Coverage gaps**: Use `--coverage` to identify untested code

### Debug Tips
- Use `console.log` in tests (they're shown on failures)
- Run single test files with `npm test filename.test.ts`
- Check mock call history with `mockFunction.mock.calls`
- Use Jest's `--verbose` flag for detailed output