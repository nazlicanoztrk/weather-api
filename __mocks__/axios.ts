export default {
  get: jest.fn(() =>
    Promise.resolve({
      data: {
        name: 'Istanbul',
        main: {
          temp: 25,
          humidity: 50,
        },
        weather: [
          {
            main: 'Clear',
            description: 'clear sky',
          },
        ],
      },
    })
  ),
};