const express = require("express");
const app = express();
const axios = require("axios");
const stripe = require("stripe")('sk_test_51K06xYGAf8gRZix0SnRp0XG3k1WGc8Ft2L6ctDsrHH0FdWrkWR4JpL1CLGxooLT5JjbxMzUcYa7hLKTUtBBCdfQT00CxaEunwE');

app.use(express.static("public"));
app.use(express.json());

app.use(function (req, res, next) {
    //Enabling CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
    next();
});

app.get("/", (req, res) => {
    res.send("<h2>This works!!</h2>");
});

app.post("/create-customer", async(req, res) => {
    const {name, email} = (req.body);

    const customer = await stripe.customers.create({
       name,
       email,
    });

    console.log(customer);
    res.send(customer)
});

app.post("/create-setup-intent", async (req, res) => {
  const { customer } = req.body;

  // console.log(customer);

  // Create a PaymentIntent with the order amount and currency
  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ["card"],
    customer
  });

  // console.log(setupIntent);

  res.send({
    clientSecret: setupIntent.client_secret,
  });
});

app.post("/block-card", async(req, res) => {
  const {customer, payment_method} = req.body;

  console.log("customer Id from server - ", customer);
  console.log("payment method from server - ", payment_method);

  // console.log("extracted payment method - ", paymentMethods);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 200000,
    currency: 'gbp',
    automatic_payment_methods: {
      enabled: true
    },
    customer: customer,
    capture_method: "manual",
    payment_method: payment_method,
    description: "Deposit for Test Drive"
  });

  console.log("paymentIntent - ", paymentIntent)
  res.send(paymentIntent);
});

app.post("/create-subscription", async(req,res) => {
  const {customer, payment_method} = req.body;

  console.log(customer, payment_method);

  const subscription = await stripe.subscriptions.create({
    customer: customer,
    items: [
      {
        price_data: {
          currency: "gbp",
          product: "prod_MAzkPTW1AsdcvC",
          recurring: {
            interval: "month",
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    default_payment_method: payment_method,
    off_session: true
  });

  console.log(subscription);
  res.send(subscription);
});

app.post("/pay-deposit", async(req, res) => {
  const {customer, payment_method} = req.body;

  console.log(customer, payment_method);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 300000,
    currency: 'gbp',
    // automatic_payment_methods: {
    //   enabled: true
    // },
    customer: customer,
    confirm: true,
    off_session: true,
    payment_method: payment_method,
    description: "Deposit for Car" 
  });

  console.log(paymentIntent);
  
  res.send(paymentIntent.id);
});

app.post("/one-time", async(req, res) => {
  const {customer, payment_method} = req.body;

  console.log(customer, payment_method);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 20000,
    currency: 'gbp',
    // automatic_payment_methods: {
    //   enabled: true
    // },
    customer: customer,
    confirm: true,
    off_session: true,
    payment_method: payment_method,
    description: "Adaptive Cruise Control - One-Time"
  });

  console.log(paymentIntent);
  res.send(paymentIntent);
})

app.post("/banking-instructions", async(req, res) => {
  const {customer} = req.body;

  console.log(customer);

  const invoiceItem1 = await stripe.invoiceItems.create({
    customer: customer,
    amount: 4916000,
    // quantity: 1,
    currency: "gbp",
    description: "Range Rover Evoque S - D165 AWD Auto. MHEV (less deposit)",
  });

  const invoice1 = await stripe.invoices.create({
    customer: customer,
    collection_method: "send_invoice", 
    auto_advance: true,
    payment_settings: {
      payment_method_types: ["customer_balance"], 
    },
    // collection_method: 'send_invoice',
    days_until_due: 5,
    description: "Range Rover Evoque S - D165 AWD Auto. MHEV (less deposit)",
  });

  const invoice1_finalize = await stripe.invoices.finalizeInvoice(
    invoice1.id
  );

  // Extended Warranty

  const invoiceItem2 = await stripe.invoiceItems.create({
    customer: customer,
    amount: 250000,
    // quantity: 1,
    currency: "gbp",
    description: "Extended Warranty (3rd to 5th Year)",
  });

  const invoice2 = await stripe.invoices.create({
    customer: customer,
    collection_method: "send_invoice", 
    auto_advance: true,
    payment_settings: {
      payment_method_types: ["customer_balance"], 
    },
    // collection_method: 'send_invoice',
    days_until_due: 5,
    description: "Extended Warranty (3rd to 5th Year)",
  });
  
  const invoice2_finalize = await stripe.invoices.finalizeInvoice(
    invoice2.id
  );

  // Branded Merchandise
  const invoiceItem3 = await stripe.invoiceItems.create({
    customer: customer,
    amount: 100000,
    // quantity: 1,
    currency: "gbp",
    description: "Branded Merchandise",
  });

  const invoice3 = await stripe.invoices.create({
    customer: customer,
    collection_method: "send_invoice", 
    auto_advance: true,
    payment_settings: {
      payment_method_types: ["customer_balance"], 
    },
    // collection_method: 'send_invoice',
    days_until_due: 5,
    description: "Branded Merchandise"
  });
  
  const invoice3_finalize = await stripe.invoices.finalizeInvoice(
    invoice3.id
  );

  // console.log(invoice3_finalize);
  if(invoice1_finalize.id && invoice2_finalize.id && invoice3_finalize.id) {
    res.send({
      status: "success"
    });
  };
});

app.post("/login", async(req, res) => {
  const response = {};

  const {customerId} = req.body;

  const customer = await stripe.customers.retrieve(
    customerId
  );

  response["name"] = customer.name;
  response["id"] = customer.id;

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  response["payment_method"] = (paymentMethods.data[0].id);

  res.send(response);
});

app.post("/release-card", async(req, res) => {
  const {paymentIntent} = req.body;

  const request = await stripe.paymentIntents.cancel(
    paymentIntent
  );

  console.log(request);

  res.send(request.status);
})


app.post("/charge-card", async(req, res) => {
  const {paymentIntent} = req.body;

  const request = await stripe.paymentIntents.confirm(
    paymentIntent,
    // {payment_method: 'pm_card_visa'}
  );

  console.log(request);

  res.send(request.status)
})

app.listen(4242, () => {
    console.log("Node server listening on port 4242!!");
});