// Import React Router
import { Routes, Route } from 'react-router-dom';

// Import Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Collection from './pages/Collection';
import About from './pages/About';
import Contact from './pages/Contact';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Login from './pages/Login';
import PlaceOrder from './pages/PlaceOrder';
import Orders from './pages/Orders';
import Footer from './components/Footer';
import SearchBar from './components/SearchBar';
import { ToastContainer } from 'react-toastify';
import Verify from './pages/Verify';
import Wishlist from './pages/Wishlist';
import ChatPopup from './components/ChatPopup';
import Profile from './pages/Profile';
import ResetPassword from './components/ResetPassword';
import Portfolio from './pages/Portfolio';
import UserEventCalendarPopup from './components/UserEventCalendarPopup';
import ErrorPage from './pages/ErrorPage';
import AIPopup from './components/AIPopup';
import PopupManager from './components/PopupManager';
import JobPostingPopup from './components/JobPostingPopup';
import AutoLogout from './components/AutoLogout';
import OrderStatus from './components/OrderStatus';
import VerifyPayment from './components/VerifyPayment';
import TrailCursor from './components/TrailCursor';
// Import Context Providers
import ShopProvider from './context/ShopContext';
import WishlistProvider from './context/WishlistContext';
import { VoucherAmountProvider } from './context/VoucherAmountContext'; // ✅ Import correctly

function App() {
  return (
    <>
      {/* <TrailCursor /> */}
      <AutoLogout />
      <ShopProvider>
        <WishlistProvider>
          <VoucherAmountProvider> {/* ✅ Wrap the provider here */}
            <div className="flex flex-col min-h-screen">
              <ToastContainer />
              <Navbar />
              <SearchBar />
              <PopupManager />

              <div className="flex-grow">
                <Routes>
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/product/:productId" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/place-order" element={<PlaceOrder />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/*" element={<ErrorPage />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/job" element={<JobPostingPopup />} />
                  <Route path="/order-status" element={<OrderStatus />} />
                  <Route path="/verify-payment" element={<VerifyPayment />} />
                </Routes>
              </div>

              <Footer />
            </div>
          </VoucherAmountProvider>
        </WishlistProvider>
      </ShopProvider>
    </>
  );
}

export default App;
