const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//const asyncHandler= ()=>{}
//const asyncHandler= (func)=>()=>{} higer odder function

//| 2nd type

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).JSON({
//       success: false,
//       massage: error.message,
//     });
//   }
// };
