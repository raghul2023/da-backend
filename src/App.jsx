import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import Products from './pages/Products';
import Categories from './pages/Categories';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Product Admin Panel
            </Typography>
            <Button color="inherit" component={Link} to="/">
              Products
            </Button>
            <Button color="inherit" component={Link} to="/categories">
              Categories
            </Button>
          </Toolbar>
        </AppBar>
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
