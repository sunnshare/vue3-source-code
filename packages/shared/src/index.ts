export const isObject = (value: unknown): value is Record<any, any> => {
  return typeof value === "object" && value !== null;
};
