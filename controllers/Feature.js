const Food = require("../models/food");
const User = require("../models/User");

//adding to cart
const addToCart = async (req, res) => {
  const userId = req.params.id;
  const { id, name, price, rating, image, quantity } = req.body;

  try {
    let existingItem = await Food.findOne({ id, userId: userId });
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.price * existingItem.quantity;
      let updatedItem = await existingItem.save();

      if (!updatedItem) {
        return res
          .status(400)
          .json({ success: false, message: "fail to add to cart" });
      }

      return res
        .status(200)
        .json({ success: true, message: "item added to cart" });
    }

    let newFood = await Food.create({
      id,
      name,
      price,
      rating,
      image,
      quantity,
      userId,
      totalPrice: price * quantity,
    });

    const saveFood = await newFood.save();

    let user = await User.findByIdAndUpdate(
      { _id: userId },
      {
        $push: {
          cartItems: saveFood._id,
        },
      }
    );

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "failed to add to cart" });
    }

    return res
      .status(200)
      .json({ success: true, message: "item added to cart" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// getting items from cart
const getCart = async (req, res) => {
  let userId = req.params.id;

  try {
    const cartItems = await Food.find({ userId });

    if (!cartItems) {
      return res.status(400).json({ success: false, message: "no cart items" });
    }

    return res.status(200).json({ success: true, cartItems });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  let foodId = req.params.id;
  let userId = req.body.userId; // Assuming userId is passed in the request body

  try {
    // Find the user by their ID
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Remove the food item ID from the user's cart array
    user.cartItems = user.cartItems.filter(itemId => itemId.toString() !== foodId);

    // Save the updated user document
    await user.save();

    // Delete the food item itself
    let food = await Food.findByIdAndDelete(foodId);

    if (!food) {
      return res.status(400).json({ success: false, message: "Food not found" });
    }

    return res.status(200).json({ success: true, message: "Food removed from cart and database" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// increment in cart
const incrementQuantity = async (req, res) => {
  let id = req.params.id;

  try {
    let food = await Food.findByIdAndUpdate(
      { _id: id },
      [{
        $set: {
          quantity: { $add: ["$quantity", 1] },
          totalPrice: { $multiply: ["$price", { $add: ["$quantity", 1] }] },
        },
      }],
      { upsert: true, new: true }
    );

    if (!food) {
      res.status(400).json({ success: false, message: "food not found" });
    }

    return res.status(200).json({ success: true, message: "food increased" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//decrement quantity
const decrementQuantity = async (req, res) => {
  let id = req.params.id;
  try {
    let food = await Food.findByIdAndUpdate(
      { _id: id, quantity: { $gt: 0 } },
      [{
        $set: {
          quantity: { $subtract: ["$quantity", 1] },
          totalPrice: { $subtract: ["$totalPrice", "$price"] },
        },
      }],
      {
        upsert: true,
        new: true,
      }
    );

    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: "food not decremented" });
    }

    return res
      .status(200)
      .json({ success: true, message: " food decremented" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


//clearCart
const clearCart = async (req, res) => {
  const userId = req.body.userId;

  try {
    // Delete all cart items associated with the user from the Food collection
    await Food.deleteMany({ userId });

    // Update the user document to clear the cart items
    await User.updateOne({ _id: userId }, { cartItems: [] });

    // Return success response
    return res.status(200).json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    // Return error response
    return res.status(500).json({ success: false, message: error.message });
  }
};




module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart,
};
