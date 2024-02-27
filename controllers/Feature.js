const Food = require("../models/food");
const User = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_KEY);

//adding to cart
const addToCart = async (req, res) => {
  const userId = req.params.id;
  const { id, name, price, rating, image, quantity } = req.body;
  console.log(name);
  console.log(userId);
  console.log(id);
  try {
    let existingItem = await Food.findOne({ id, userId: userId });
    console.log(existingItem);
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
  let id = req.params.id;

  try {
    let food = await Food.findByIdAndDelete({ _id: id });

    if (!food) {
      return res
        .status(400)
        .json({ success: false, message: "food not found" });
    }

    return res.status(200).json({ success: true, message: "food removed" });
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
      {
        $set: {
          quantity: { $add: ["$quantity", 1] },
          totalPrice: { $multiply: ["$price", { $add: ["$quantity", 1] }] },
        },
      },
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
      {
        $set: {
          quantity: { $subtract: ["$quantity", 1] },
          totalPrice: { $subtract: ["$totalPrice", "$price"] },
        },
      },
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

//checkout
const checkout = async (req, res) => {
  let userId = req.id;

  try {
    const cartItems = await Food.find({ userId });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: cartItems.map((item) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
              images: [item.image],
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        };
      }),
      success_url: "http://localhost:5173/success",
      cancel_url: "http//localhost:5173/",
    });

    res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
//clearCart
const clearCart = async (req, res) => {
  let userId = req.id;

  try {
    const deletedItems = await Food.deleteMany({ userId });

    const deletedList = await Food.findOneAndUpdate(
      { _id: id },
      {
        cartItems: [],
      }
    );

    if (!deletedItems) {
      return res
        .status(400)
        .json({ success: false, message: "failed to clear cart" });
    }

    return res.status(200).json({ success: true, message: " order confirmed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  checkout,
  clearCart,
};
