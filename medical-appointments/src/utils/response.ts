export const createResponse = (
  statusCode: number,
  message: string | object
) => {
  return {
    statusCode,
    body: typeof message === "string" ? message : JSON.stringify(message),
  };
};
