import React, { useState } from 'react';
import { useNotify } from "../context/NotificationContext";

const RegisterPartner = () => {
    const { notify } = useNotify();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'owner', // Default role
        businessType: 'hotel' // hotel or transport
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Partner Data:", formData);
        // Yahan backend API call hogi: axios.post('/api/register', formData)
        notify("Registration Successful! Admin approval pending", "success");
    };

    return (
        <div className="container">
            <h2>Join Mountain-Mate as a Partner</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                
                <label>Registering for:</label>
                <select name="businessType" onChange={handleChange}>
                    <option value="hotel">Hotel / Homestay</option>
                    <option value="transport">Taxi / Transport</option>
                </select>

                <button type="submit">Register Now</button>
            </form>
        </div>
    );
};

export default RegisterPartner;