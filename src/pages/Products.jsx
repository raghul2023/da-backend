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
import { useEffect, useState } from 'react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    availableSizes: '',
    color: '',
    images: '',
    stock: '', // Input will be "S:10, M:20, L:15"
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://backend-da-clothing.vercel.app/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://backend-da-clothing.vercel.app/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.category) {
      alert('Please select a category.');
      return;
    }
    try {
      // 1. Create the inner SizeStockDto object from the input string
      const sizeStock = Object.fromEntries(
        newProduct.stock.split(',').map((item) => {
          const [size, quantity] = item.split(':').map((s) => s.trim());
          return [size.toUpperCase(), parseInt(quantity, 10) || 0]; // Ensure quantity is a number
        })
      );

      // 2. Construct the full payload matching the DTO structure
      const productData = {
        id: String(Date.now()),
        title: newProduct.title,
        description: newProduct.description,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        availableSizes: newProduct.availableSizes.split(',').map((size) => size.trim()),
        variants: [
          {
            color: newProduct.color,
            images: newProduct.images.split(',').map((url) => url.trim()),
            // This now exactly matches the nested DTO structure:
            // VariantDto -> stock: StockDto -> stock: SizeStockDto
            stock: {
              // This object is the StockDto
              stock: sizeStock, // This nested object is the SizeStockDto
            },
          },
        ],
      };

      await axios.post('https://backend-da-clothing.vercel.app/api/products', productData);

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
      fetchProducts();
    } catch (error) {
      console.error(
        'Error creating product:',
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`https://backend-da-clothing.vercel.app/api/products/${productId}`);
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
          onClose={() => setIsAdded(false)}
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
                rows={3}
                required
                fullWidth
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                label="Price"
                type="number"
                inputProps={{ step: '0.01' }}
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
                    key={product.id || product._id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {product.title}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <img
                        alt={product?.title}
                        src={product?.variants[0]?.images[0]}
                        width="100"
                        height="100"
                        style={{ objectFit: 'cover' }}
                      />
                    </TableCell>
                    <TableCell align="right">${parseFloat(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      {Array.isArray(product.availableSizes)
                        ? product.availableSizes.join(', ')
                        : ''}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleDelete(product.id || product._id)}
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
                  <TableCell colSpan={6} align="center">
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
