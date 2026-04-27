import React, { useState } from 'react';
import logo from '../images/logo.png';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [partsStore, setPartsStore] = useState('');
  const [customStore, setCustomStore] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const storeToSave = partsStore === 'Other' ? customStore : partsStore;
      // Add storeToSave to user metadata or a separate table as needed
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            parts_store: storeToSave,
          },
        },
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Wait for user to be available
      const user = data?.user;
      if (user) {
        // Store session in localStorage for immediate access
        if (data.session) {
          localStorage.setItem('porkchop-session', JSON.stringify(data.session));
        }
        // Navigate directly to dashboard after signup
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };



  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-sand">
        <div className="w-full max-w-sm">
          <div className="bg-maineBlue rounded-t-lg flex flex-col items-center justify-center py-6">
            <img src={logo} alt="PorkChop Logo" className="h-16 w-16 object-contain mb-2" />
          </div>
          <form onSubmit={handleSignUp} className="bg-white p-8 rounded-b-lg shadow max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-6 text-maineBlue">Sign Up</h2>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mb-3 p-2 border rounded"
              required
            />
            <label className="block mb-2 font-semibold">Preferred Auto Parts Store</label>
            <select
              className="w-full mb-3 p-2 border rounded"
              value={partsStore}
              onChange={e => setPartsStore(e.target.value)}
              required
            >
              <option value="">Select a store...</option>
              <option value="AutoZone">AutoZone</option>
              <option value="O'Reilly Auto Parts">O'Reilly Auto Parts</option>
              <option value="NAPA Auto Parts">NAPA Auto Parts</option>
              <option value="Advance Auto Parts">Advance Auto Parts</option>
              <option value="CarQuest">CarQuest</option>
              <option value="RockAuto">RockAuto</option>
              <option value="Amazon Automotive">Amazon Automotive</option>
              <option value="Other">Other</option>
            </select>
            {partsStore === 'Other' && (
              <input
                type="text"
                className="w-full mb-4 p-2 border rounded"
                placeholder="Enter your store name"
                value={customStore}
                onChange={e => setCustomStore(e.target.value)}
                required
              />
            )}
            <button 
              type="submit" 
              className="w-full bg-maineBlue text-seafoam py-2 rounded font-semibold hover:bg-seafoam hover:text-maineBlue transition-colors"
            >
              Sign Up
            </button>
            <div className="mt-4 text-center text-sm">
              Already have an account? <Link to="/signin" className="text-maineBlue underline">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUp;

