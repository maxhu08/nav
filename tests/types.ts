export type TestDefinition<T> = {
  desc: string;
  test: T;
};

export type ConfigMigrationTestType = () => void;

export type ConfigMigrationTestCase = TestDefinition<ConfigMigrationTestType>;