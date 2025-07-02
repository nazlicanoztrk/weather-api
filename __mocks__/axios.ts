export default {
  get: jest.fn(() =>
    Promise.resolve({
      data: {
        name: 'Istanbul',
        main: { temp: 25, humidity: 60 },
        weather: [{ main: 'Clear', description: 'clear sky' }],
      },
    })
  ),
};