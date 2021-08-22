require("dotenv").config()
const express = require("express")
const app = express()
const fs = require("fs")

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const PORT = process.env.PORT || 3000

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.static("public"))

const stripe = require("stripe")(stripeSecretKey)

app.get("/", (req, res) => {
  fs.readFile("items.json", (error, data) => {
    error
      ? res.status(500).end()
      : res.render("store.ejs", { items: JSON.parse(data) })
  })
})

app.post("/create-checkout-session", (req, res) => {
  fs.readFile("items.json", async (error, data) => {
    if (error) {
      res.status(500).end()
    } else {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: req.body.items.map(item => {
            const itemJson = [
              ...JSON.parse(data).music,
              ...JSON.parse(data).merch,
            ].find(i => {
              return i.id == item.id
            })
            return {
              price_data: {
                currency: "usd",
                product_data: {
                  name: itemJson.name,
                },
                unit_amount: itemJson.price,
              },
              quantity: item.quantity,
            }
          }),
          success_url: `${process.env.CLIENT_URL}/success.html`,
          cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
        })
        res.json({ url: session.url })
      } catch (e) {
        res.status(500).json({ error: e.message })
      }
    }
  })
  // const { items } = req.body
  // console.log(items, process.env.CLIENT_URL)
})

app.listen(PORT, () => {
  console.log("Server is running...")
})
