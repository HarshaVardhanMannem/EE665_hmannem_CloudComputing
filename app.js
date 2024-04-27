require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Database configuration
const dbConfig = {
    user: process.env.DbUsername,
    password: process.env.DbUserPassword,
    server: process.env.DbServerName,
    database: process.env.DbName,
    options: {
        encrypt: true // For Azure SQL
    }
};

// Connect to the database
sql.connect(dbConfig)
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Database connection failed:', err));

// Endpoint to create a new product
app.post('/products', async (req, res) => {
    const { name, price, quantity } = req.body;

    try {
        // Create a new request instance
        const request = new sql.Request();

        // Execute the query to insert data into the 'products' table
        await request.query(`INSERT INTO products (name, price, quantity) VALUES ('${name}', ${price}, ${quantity})`);

        res.status(201).json({ message: 'Product created successfully.' });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Endpoint to retrieve all products
app.get('/products', async (req, res) => {
    try {
        // Create a new request instance
        const request = new sql.Request();

        // Build the SQL query to retrieve all products
        let query = 'SELECT * FROM products';

        // Add filters based on query parameters (if provided)
        if (req.query.minPrice) {
            query += ` WHERE price >= ${parseFloat(req.query.minPrice)}`;
        }
        if (req.query.maxPrice) {
            query += ` WHERE price <= ${parseFloat(req.query.maxPrice)}`;
        }
        if (req.query.minQuantity) {
            query += ` WHERE quantity >= ${parseInt(req.query.minQuantity)}`;
        }
        if (req.query.maxQuantity) {
            query += ` WHERE quantity <= ${parseInt(req.query.maxQuantity)}`;
        }

        // Execute the query
        const result = await request.query(query);

        // Send the list of products as the response
        res.json(result.recordset);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Endpoint to retrieve a single product by ID
app.get('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        // Create a new request instance
        const request = new sql.Request();

        // Execute the query to retrieve the product by ID
        const result = await request.query(`SELECT * FROM products WHERE id = ${productId}`);

        // Check if the product exists
        if (result.recordset.length > 0) {
            // Send the product details as the response
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'Product not found.' });
        }
    } catch (error) {
        console.error('Error retrieving product:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Endpoint to update a product by ID
app.put('/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, price, quantity } = req.body;

    try {
        // Create a new request instance
        const request = new sql.Request();

        // Execute the query to update the product
        await request.query(`UPDATE products SET name = '${name}', price = ${price}, quantity = ${quantity} WHERE id = ${productId}`);

        // Send a success message as the response
        res.json({ message: 'Product updated successfully.' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Endpoint to delete a product by ID
app.delete('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        // Create a new request instance
        const request = new sql.Request();

        // Execute the query to delete the product
        await request.query(`DELETE FROM products WHERE id = ${productId}`);

        // Send a success message as the response
        res.json({ message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
