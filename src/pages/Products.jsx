import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Select, // <-- Import Select
  MenuItem, // <-- Import MenuItem
  FormControl, // <-- Import FormControl
  InputLabel, // <-- Import InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { CheckCircleOutline } from '@mui/icons-material';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [categories, setCategories] = useState([]); // To store fetched categories
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: '', // This will now hold the selected category name (or ID)
    price: '',
    availableSizes: '',
    color: '',
    images: '',
    stock: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Make sure to call the function
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories'); // Ensure this is your correct API endpoint for categories
      // Assuming the response.data is an array of category objects like [{_id: '1', name: 'Electronics', products: [...]}, ...]
      // Or if it's directly an array of {name: 'Category 1', products: []} from your earlier NestJS setup
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set to empty array on error to prevent map issues
    }
  };

  const fetchProducts = async () => {
    try {
      // Make sure your backend API endpoint for fetching all products is correct.
      // Based on your previous NestJS setup, it might be just '/products'
      // or if you want products grouped by categories, the '/categories' endpoint does that.
      // For a simple product list, let's assume you have a '/products' endpoint.
      const response = await axios.get('http://localhost:3000/api/products'); // Adjust if your product endpoint is different
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure category is selected
    if (!newProduct.category) {
      alert('Please select a category.'); // Or use a more sophisticated notification
      return;
    }
    try {
      const productData = {
        id: String(Date.now()), // Or let the backend generate it
        title: newProduct.title,
        description: newProduct.description,
        category: newProduct.category, // This is the category name
        price: parseFloat(newProduct.price),
        availableSizes: newProduct.availableSizes.split(',').map((size) => size.trim()),
        variants: [
          {
            color: newProduct.color,
            images: newProduct.images.split(',').map((url) => url.trim()),
            // Your backend expects stock as a Map or an object for each variant,
            // current structure: stock: { stock: { S: 10, M: 20 } }
            // Backend Schema (Product -> variants -> stock: Map<string, number>)
            // So the stock should be directly the object {S:10, M:20}
            stock: Object.fromEntries(
              newProduct.stock.split(',').map((item) => {
                const [size, quantity] = item.split(':').map((s) => s.trim());
                return [size, parseInt(quantity, 10)];
              })
            ),
          },
        ],
        // Add other fields like brand, gender, material, etc., if your backend needs them.
        // The example uses a simple structure for the product form.
      };

      // Use the correct endpoint for adding a product.
      // Based on your NestJS setup, it should be POST /products
      await axios.post('http://localhost:3000/products', productData);
      setNewProduct({
        title: '',
        description: '',
        category: '',
        price: '',
        availableSizes: '',
        color: '',
        images: '',
        stock: '',
      });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error(
        'Error creating product:',
        error.response ? error.response.data : error.message
      );
      // Optionally show an error alert to the user
    }
  };

  const handleDelete = async (productId) => {
    // productId could be the custom 'id' or MongoDB '_id'
    try {
      // Adjust the endpoint if your NestJS delete uses the custom 'id' field.
      // Your NestJS `ProductsController` has `GET /products/:productId` where productId is the custom ID.
      // Assuming you have a similar `DELETE /products/:productId` endpoint.
      await axios.delete(`http://localhost:3000/products/${productId}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <>
      {isAdded && (
        <Alert
          icon={<CheckCircleOutline fontSize="inherit" />}
          severity="success"
          onClose={() => setIsAdded(false)} // Allow closing the alert
          sx={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            minWidth: '300px',
          }}
        >
          Product added successfully.
        </Alert>
      )}
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manage Products
        </Typography>

        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Product
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                label="Title"
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                required
                fullWidth
              />
              {/* Category Dropdown */}
              <FormControl fullWidth required>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={newProduct.category}
                  label="Category"
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      // Assuming cat object has a 'name' property for display
                      // and you want to send the name as the value.
                      // If your backend expects category ID, use cat._id (or similar) as value.
                      <MenuItem key={cat._id || cat.name} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      Loading categories...
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <TextField
                label="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                multiline
                rows={3} // Increased rows for better UX
                required
                fullWidth
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }} // Span full width on small screens too
              />
              <TextField
                label="Price"
                type="number"
                inputProps={{ step: '0.01' }} // For decimal prices
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Available Sizes (comma-separated)"
                value={newProduct.availableSizes}
                onChange={(e) => setNewProduct({ ...newProduct, availableSizes: e.target.value })}
                required
                fullWidth
                helperText="e.g., S, M, L, XL"
              />
              <TextField
                label="Variant Color"
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                required
                fullWidth
                helperText="e.g., Blue"
              />
              <TextField
                label="Variant Images (comma-separated URLs)"
                value={newProduct.images}
                onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                required
                fullWidth
                helperText="e.g., url1.jpg, url2.jpg"
              />
              <TextField
                label="Variant Stock (Size:Qty, e.g. S:10,M:5)"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                required
                fullWidth
                helperText="e.g., S:10,M:20,L:15"
              />
            </Box>
            <Button type="submit" variant="contained" sx={{ mt: 3, py: 1.5 }}>
              {' '}
              {/* Increased padding */}
              Add Product
            </Button>
          </form>
        </Paper>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Product List
        </Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
                {' '}
                {/* Header background */}
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Price
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sizes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow
                    key={product.id || product._id} // Use MongoDB _id if available, fallback to custom id
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {product.title}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell align="right">${parseFloat(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      {Array.isArray(product.availableSizes)
                        ? product.availableSizes.join(', ')
                        : ''}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleDelete(product.id || product._id)} // Use the correct ID for deletion
                        color="error"
                        aria-label="delete product"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default Products;
