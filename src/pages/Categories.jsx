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
  CircularProgress,
  Chip,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import axios from 'axios';
import { ENDPOINTS, buildURL } from '../config/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching categories from:', buildURL(ENDPOINTS.CATEGORIES));
      const response = await axios.get(buildURL(ENDPOINTS.CATEGORIES));
      console.log('Categories response:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch categories';
      setError(`Error fetching categories: ${errorMessage}`);
      setShowError(true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!newCategory || !newCategory.trim()) {
      setError('Please enter a category name');
      setShowError(true);
      return;
    }

    if (newCategory.trim().length < 2) {
      setError('Category name must be at least 2 characters long');
      setShowError(true);
      return;
    }

    // Check for duplicate category names
    const isDuplicate = categories.some(
      cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      setError('A category with this name already exists');
      setShowError(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Creating category with data:', { name: newCategory.trim() });
      console.log('API URL:', buildURL(ENDPOINTS.CATEGORIES));
      
      const response = await axios.post(buildURL(ENDPOINTS.CATEGORIES), {
        name: newCategory.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('Category created successfully:', response.data);
      
      setNewCategory('');
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 3000);
      
      // Refresh categories list
      await fetchCategories();
      
    } catch (error) {
      console.error('Error creating category:', error);
      
      let errorMessage = 'Failed to create category';
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response.data);
        errorMessage = error.response.data?.message || 
                     (Array.isArray(error.response.data?.message) 
                       ? error.response.data.message.join(', ') 
                       : `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setEditingName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (categoryId) => {
    if (!editingName || !editingName.trim()) {
      setError('Please enter a category name');
      setShowError(true);
      return;
    }

    if (editingName.trim().length < 2) {
      setError('Category name must be at least 2 characters long');
      setShowError(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Updating category:', categoryId, 'with data:', { name: editingName.trim() });
      
      const response = await axios.put(buildURL(ENDPOINTS.CATEGORY_BY_ID(categoryId)), {
        name: editingName.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('Category updated successfully:', response.data);
      
      setEditingId(null);
      setEditingName('');
      setIsUpdated(true);
      setTimeout(() => setIsUpdated(false), 3000);
      
      await fetchCategories();
      
    } catch (error) {
      console.error('Error updating category:', error);
      
      let errorMessage = 'Failed to update category';
      
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Deleting category:', id);
      
      await axios.delete(buildURL(ENDPOINTS.CATEGORY_BY_ID(id)), {
        timeout: 10000,
      });

      console.log('Category deleted successfully');
      await fetchCategories();
      
    } catch (error) {
      console.error('Error deleting category:', error);
      
      let errorMessage = 'Failed to delete category';
      
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
          Category added successfully!
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
          Category updated successfully!
        </Alert>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
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
          Manage Categories
        </Typography>

        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Add New Category
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
                fullWidth
                disabled={loading}
                error={!newCategory.trim() && newCategory !== ''}
                helperText={
                  !newCategory.trim() && newCategory !== '' 
                    ? 'Category name is required' 
                    : 'Enter a unique category name (min 2 characters)'
                }
                inputProps={{
                  minLength: 2,
                  maxLength: 50,
                }}
              />
              <Button 
                type="submit" 
                variant="contained"
                disabled={loading || !newCategory.trim()}
                sx={{ minWidth: '120px', height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Category'}
              </Button>
            </Box>
          </form>
        </Paper>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Category List ({categories.length})
        </Typography>
        
        {loading && categories.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading categories...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[200] }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Products Count</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow 
                      key={category._id}
                      sx={{
                        '&:hover': { backgroundColor: (theme) => theme.palette.action.hover },
                      }}
                    >
                      <TableCell>
                        {editingId === category._id ? (
                          <TextField
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            size="small"
                            fullWidth
                            autoFocus
                            disabled={loading}
                            inputProps={{
                              minLength: 2,
                              maxLength: 50,
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(category._id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {category.name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={category.products?.length || 0} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell align="center">
                        {editingId === category._id ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton
                              onClick={() => handleSaveEdit(category._id)}
                              color="primary"
                              size="small"
                              disabled={loading || !editingName.trim()}
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              onClick={handleCancelEdit}
                              color="secondary"
                              size="small"
                              disabled={loading}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton
                              onClick={() => handleEdit(category)}
                              color="primary"
                              size="small"
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDelete(category._id)} 
                              color="error"
                              size="small"
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {loading ? 'Loading...' : 'No categories found. Add your first category above!'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </>
  );
};

export default Categories;
