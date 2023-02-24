// Approximates the optimal (r squared) control points for a cubic bezier curve that fits a quarter wavelength of a sine function using gradient descent
// This is a naive implementation partially because I was lazy to do more algebra with nasty cubics but also because I didn't memoize the r2 function at all

const By_t = (t: number, x_2: number) => 1 - t ** 3 + 3 * (1 - t ** 2) * t * 3 * (1 - t) * t ** 2 * (1 - x_2);

const Bx_t = (t: number, x_1: number, x_2: number) => 3 * (1 - t) ** 2 * t * x_1 + 3 * (1 - t) * t ** 2 * x_2 + t ** 3;

const r2 = (t: number, x_1: number, x_2: number) => {
  const x = Bx_t(t, x_1, x_2);
  const y = By_t(t, x_2);
  return (Math.cos((x * Math.PI) / 2) - y) ** 2;
};

const tStep = 0.05;

const sum = (x_1: number, x_2: number) => {
  let sum = 0;
  for (let t = 0; t <= 1; t += tStep) {
    sum += r2(t, x_1, x_2);
  }
  return sum;
};

let delta = 0.02;

const gradientAt = (x_1: number, x_2: number) => {
  const sum_1 = sum(x_1 + delta, x_2);
  const sum_2 = sum(x_1 - delta, x_2);
  const sum_3 = sum(x_1, x_2 + delta);
  const sum_4 = sum(x_1, x_2 - delta);
  return [sum_1 - sum_2, sum_3 - sum_4];
};

const gradientDescent = (x_1: number, x_2: number) => {
  const [grad_1, grad_2] = gradientAt(x_1, x_2);
  const x_1_new = x_1 - delta * grad_1;
  const x_2_new = x_2 - delta * grad_2;
  return [x_1_new, x_2_new];
};

const run = () => {
  let x_1 = 0.5;
  let x_2 = 0.5;
  let acm = 0;
  for (let i = 0; i < 100; i++) {
    [x_1, x_2] = gradientDescent(x_1, x_2);
    acm = sum(x_1, x_2);
    console.log(acm);
  }
  console.log(x_1, x_2);
};

run();
