const query = jest.fn();
const execute = jest.fn();

module.exports = {
  query,
  execute,
  getConnection: jest.fn(async () => ({ query, execute })),
};
