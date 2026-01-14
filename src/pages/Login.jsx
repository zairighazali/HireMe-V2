import { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

export default function Login() {
  const navigate = useNavigate();
  //const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    "https://41bbbbbf-93d5-4a52-aef1-e65635945258-00-3tcqp4xlzxntf.pike.replit.dev";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        setError("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }

      const token = await cred.user.getIdToken();

      // Sync backend Neon
      await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update AuthContext
      //setUser({ firebaseUser: cred.user, token });

      navigate("/profile");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 400 }}>
      <h3 className="mb-4 text-center">Login</h3>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Control
          className="mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Form.Control
          type="password"
          className="mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-100 mb-3" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </Form>

      <p className="text-center small text-muted">
        No account?{" "}
        <Link to="/register" className="text-primary fw-semibold text-decoration-none">
          Register
        </Link>
      </p>
    </Container>
  );
}