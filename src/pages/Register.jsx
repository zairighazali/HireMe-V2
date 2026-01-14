import { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../firebase";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const API_BASE_URL =
    "https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Create Firebase user
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 2️⃣ Update display name
      await updateProfile(cred.user, {
        displayName: form.name,
      });

      // 3️⃣ Send verification email
      await sendEmailVerification(cred.user);

      // 4️⃣ Get Firebase ID token
      const token = await cred.user.getIdToken();

      // 5️⃣ Sync with backend (auto create user in Neon)
      await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
        }),
      });

      // 6️⃣ Redirect
      navigate("/login");
    } catch (err) {
      setError(err.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 400 }}>
      <h3 className="mb-4">Register</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Control
          className="mb-3"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <Form.Control
          className="mb-3"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <Form.Control
          type="password"
          className="mb-3"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <Button type="submit" className="w-100" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </Button>
      </Form>
    </Container>
  );
}