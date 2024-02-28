const { signup, login, logout, resetPassword, verifyOTP, getUser } = require("./controllers/Auth");
const { addToCart, removeFromCart, getCart, incrementQuantity, decrementQuantity, clearCart } = require("./controllers/Feature");
const { verifyToken } = require("./middleware/verifyToken");

const router=require("express").Router();

//auth routes
router.post("/signup",signup);
router.post("/login",login);
router.get("/logout",logout);
router.get("/getUser",verifyToken,getUser);

//feature routes
router.post("/addToCart/:id", addToCart);
router.delete("/removeFromCart/:id",removeFromCart);
router.get("/getCart/:id",getCart);
router.put("/incrementQuantity/:id",incrementQuantity);
router.put("/decrementQuantity/:id",decrementQuantity);
router.delete("/clearCart",verifyToken,clearCart);


module.exports=router;