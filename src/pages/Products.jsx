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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Snackbar,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_BASE_URL, ENDPOINTS, buildURL, API_DEFAULTS } from '../config/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imageArr, setImageArr] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    moq: '1',
    availableSizes: '',
    color: '',
    images: '',
    stock: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    console.log('Uploading files:', files);
    
    if (files.length > 0) {
      setImages((prevImages) => [...prevImages, ...files]);
      setLoading(true);
      
      try {
        const promiseArr = files.map(async (image) => {
          const formData = new FormData();
          formData.append('image', image);
          const res = await fetch(
            'https://api.imgbb.com/1/upload?&key=f3145a10e034400f4b912f8123f851b1',
            {
              method: 'POST',
              body: formData,
            }
          );
          
          if (!res.ok) {
            throw new Error(`Image upload failed: ${res.statusText}`);
          }
          
          const data = await res.json();
          if (data && data.data) {
            return data.data.display_url;
          }
          throw new Error('Invalid response from image service');
        });

        const urls = await Promise.all(promiseArr);
        setImageArr(urls);
        console.log('Images uploaded successfully:', urls);
      } catch (err) {
        console.error('Image upload error:', err);
        setError('Failed to upload images: ' + err.message);
        setShowError(true);
      } finally {
        setLoading(false);
      }
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from:', buildURL(ENDPOINTS.CATEGORIES));
      const response = await axios.get(buildURL(ENDPOINTS.CATEGORIES), API_DEFAULTS);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch categories';
      setError(`Error fetching categories: ${errorMessage}`);
      setShowError(true);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products from:', buildURL(ENDPOINTS.PRODUCTS));
      const response = await axios.get(buildURL(ENDPOINTS.PRODUCTS), API_DEFAULTS);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch products';
      setError(`Error fetching products: ${errorMessage}`);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const validateProduct = (product) => {
    const errors = [];
    
    if (!product.title?.trim()) errors.push('Title is required');
    if (!product.category?.trim()) errors.push('Category is required');
    if (!product.description?.trim()) errors.push('Description is required');
    if (!product.price || parseFloat(product.price) <= 0) errors.push('Price must be greater than 0');
    if (!product.moq || parseInt(product.moq) < 1) errors.push('MOQ must be at least 1');
    if (!product.availableSizes?.trim()) errors.push('Available sizes are required');
    if (!product.color?.trim()) errors.push('Color is required');
    if (!product.stock?.trim()) errors.push('Stock information is required');
    if (imageArr.length === 0) errors.push('At least one image is required');
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateProduct(newProduct);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setShowError(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Parse stock information
      const sizeStock = Object.fromEntries(
        newProduct.stock.split(',').map((item) => {
          const [size, quantity] = item.split(':').map((s) => s.trim());
          return [size.toUpperCase(), parseInt(quantity, 10) || 0];
        })
      );

      const productData = {
        id: String(Date.now()),
        title: newProduct.title.trim(),
        description: newProduct.description.trim(),
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        moq: parseInt(newProduct.moq, 10),
        availableSizes: newProduct.availableSizes.split(',').map((size) => size.trim()),
        variants: [
          {
            color: newProduct.color.trim(),
            images: imageArr,
            stock: {
              stock: sizeStock,
            },
          },
        ],
      };

      console.log('Creating product with data:', productData);
      
      const response = await axios.post(buildURL(ENDPOINTS.PRODUCTS), productData, {
        ...API_DEFAULTS,
        timeout: 15000, // Longer timeout for product creation
      });

      console.log('Product created successfully:', response.data);

      // Reset form
      setNewProduct({
        title: '',
        description: '',
        category: '',
        price: '',
        moq: '1',
        availableSizes: '',
        color: '',
        images: '',
        stock: '',
      });
      setImageArr([]);
      setImages([]);
      
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
      
      await fetchProducts();
      
    } catch (error) {
      console.error('Error creating product:', error);
      
      let errorMessage = 'Failed to create product';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      (Array.isArray(error.response.data?.message) 
                        ? error.response.data.message.join(', ') 
                        : `Server error: ${error.response.status}`);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({
      ...product,
      moq: product.moq || 1,
      availableSizes: Array.isArray(product.availableSizes) ? product.availableSizes.join(', ') : '',
    });
    setOpenEditDialog(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editingProduct) return;
    
    const validationErrors = [];
    if (!editingProduct.title?.trim()) validationErrors.push('Title is required');
    if (!editingProduct.category?.trim()) validationErrors.push('Category is required');
    if (!editingProduct.description?.trim()) validationErrors.push('Description is required');
    if (!editingProduct.price || parseFloat(editingProduct.price) <= 0) validationErrors.push('Price must be greater than 0');
    if (!editingProduct.moq || parseInt(editingProduct.moq) < 1) validationErrors.push('MOQ must be at least 1');
    if (!editingProduct.availableSizes?.trim()) validationErrors.push('Available sizes are required');
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setShowError(true);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const updateData = {
        title: editingProduct.title.trim(),
        description: editingProduct.description.trim(),
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        moq: parseInt(editingProduct.moq, 10),
        availableSizes: editingProduct.availableSizes.split(',').map((size) => size.trim()),
      };

      console.log('Updating product:', editingProduct._id, 'with data:', updateData);

      const response = await axios.put(buildURL(ENDPOINTS.PRODUCT_BY_ID(editingProduct._id)), updateData, API_DEFAULTS);
      
      console.log('Product updated successfully:', response.data);
      
      setOpenEditDialog(false);
      setEditingProduct(null);
      setIsUpdated(true);
      setTimeout(() => setIsUpdated(false), 3000);
      
      await fetchProducts();
      
    } catch (error) {
      console.error('Error updating product:', error);
      
      let errorMessage = 'Failed to update product';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      (Array.isArray(error.response.data?.message) 
                        ? error.response.data.message.join(', ') 
                        : `Server error: ${error.response.status}`);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Deleting product:', productId);
      
      await axios.delete(buildURL(ENDPOINTS.PRODUCT_BY_ID(productId)), API_DEFAULTS);
      
      console.log('Product deleted successfully');
      await fetchProducts();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      
      let errorMessage = 'Failed to delete product';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      (Array.isArray(error.response.data?.message) 
                        ? error.response.data.message.join(', ') 
                        : `Server error: ${error.response.status}`);
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
    setError('');
  };

  return (
    <>
      {/* Success Alerts */}
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
          Product added successfully!
        </Alert>
      )}
      
      {isUpdated && (
        <Alert
          icon={<CheckCircleOutline fontSize="inherit" />}
          severity="success"
          onClose={() => setIsUpdated(false)}
          sx={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            minWidth: '300px',
          }}
        >
          Product updated successfully!
        </Alert>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={8000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          icon={<ErrorOutline fontSize="inherit" />}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

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
                disabled={loading}
              />
              <FormControl fullWidth required disabled={loading}>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
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
                      {loading ? 'Loading categories...' : 'No categories available'}
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
                disabled={loading}
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                label="Price"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
                fullWidth
                disabled={loading}
              />
              <TextField
                label="MOQ (Minimum Order Quantity)"
                type="number"
                inputProps={{ min: '1' }}
                value={newProduct.moq}
                onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })}
                required
                fullWidth
                disabled={loading}
                helperText="Minimum quantity that can be ordered"
              />
              <TextField
                label="Available Sizes (comma-separated)"
                value={newProduct.availableSizes}
                onChange={(e) => setNewProduct({ ...newProduct, availableSizes: e.target.value })}
                required
                fullWidth
                disabled={loading}
                helperText="e.g., S, M, L, XL"
              />
              <TextField
                label="Variant Color"
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                required
                fullWidth
                disabled={loading}
                helperText="e.g., Blue"
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Product Images *
                </Typography>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleImageUpload}
                  accept="image/*"
                  disabled={loading}
                  style={{ width: '100%', padding: '8px' }}
                />
                {imageArr.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {imageArr.map((url, index) => (
                      <img 
                        key={index} 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              <TextField
                label="Variant Stock (Size:Qty, e.g. S:10,M:5)"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                required
                fullWidth
                disabled={loading}
                helperText="e.g., S:10,M:20,L:15"
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ mt: 3, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Product'}
            </Button>
          </form>
        </Paper>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Product List ({products.length})
        </Typography>
        {loading && products.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading products...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Price</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">MOQ</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Sizes</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
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
                        {product?.variants?.[0]?.images?.[0] ? (
                          <img
                            alt={product?.title}
                            src={product?.variants[0]?.images[0]}
                            width="60"
                            height="60"
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              width: 60, 
                              height: 60, 
                              bgcolor: 'grey.200', 
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              color: 'grey.600'
                            }}
                          >
                            No Image
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">${parseFloat(product.price).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={product.moq || 1} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {Array.isArray(product.availableSizes)
                          ? product.availableSizes.join(', ')
                          : ''}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleEdit(product)}
                          color="primary"
                          aria-label="edit product"
                          size="small"
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(product._id)}
                          color="error"
                          aria-label="delete product"
                          size="small"
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {loading ? 'Loading...' : 'No products found. Add your first product above!'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Edit Product Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => !loading && setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          {editingProduct && (
            <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
              <TextField
                label="Title"
                value={editingProduct.title}
                onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                fullWidth
                disabled={loading}
                required
              />
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editingProduct.category}
                  label="Category"
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat._id || cat.name} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Description"
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                disabled={loading}
                required
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Price"
                  type="number"
                  inputProps={{ step: '0.01', min: '0' }}
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  fullWidth
                  disabled={loading}
                  required
                />
                <TextField
                  label="MOQ"
                  type="number"
                  inputProps={{ min: '1' }}
                  value={editingProduct.moq}
                  onChange={(e) => setEditingProduct({ ...editingProduct, moq: e.target.value })}
                  fullWidth
                  disabled={loading}
                  required
                />
              </Box>
              <TextField
                label="Available Sizes (comma-separated)"
                value={editingProduct.availableSizes}
                onChange={(e) => setEditingProduct({ ...editingProduct, availableSizes: e.target.value })}
                fullWidth
                disabled={loading}
                required
                helperText="e.g., S, M, L, XL"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleUpdateSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Products;
