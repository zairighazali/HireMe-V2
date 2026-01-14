import { useState, useEffect, useCallback } from "react";
import { Container, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise, createPaymentIntent } from "../services/stripe";
import { authFetch } from "../services/api";

const CheckoutForm = ({ amount, hireId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      const { clientSecret } = await createPaymentIntent(amount * 100); // Convert to cents

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        // Confirm payment with backend
        await authFetch(`/payments/confirm/${hireId}`, {
          method: "POST",
          body: JSON.stringify({
            payment_intent_id: result.paymentIntent.id,
          }),
        });

        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Card Details</Form.Label>
        <div className="border p-3 rounded">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>
      </Form.Group>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-100"
        disabled={!stripe || loading}
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Processing...
          </>
        ) : (
          `Pay RM${amount}`
        )}
      </Button>
    </Form>
  );
};

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hire, setHire] = useState(null);
  const [loading, setLoading] = useState(true);

  const hireId = searchParams.get("hireId");

  const fetchHireDetails = useCallback(async () => {
    try {
      const response = await authFetch(`/hires/${hireId}`);
      if (response.ok) {
        const data = await response.json();
        setHire(data);
      } else {
        throw new Error("Failed to fetch hire details");
      }
    } catch (error) {
      console.error("Error fetching hire:", error);
      alert("Failed to load payment details");
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  }, [hireId, navigate]);

  useEffect(() => {
    if (hireId) {
      fetchHireDetails();
    }
  }, [hireId, fetchHireDetails]);

  const handlePaymentSuccess = () => {
    alert("Payment successful!");
    navigate("/profile");
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading payment details...</p>
      </Container>
    );
  }

  if (!hire) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">Payment details not found</Alert>
        <Button onClick={() => navigate("/profile")}>Back to Profile</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: 600 }}>
      <Card>
        <Card.Header>
          <h4>Complete Payment</h4>
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <h5>Job: {hire.job_title}</h5>
            <p className="text-muted">Freelancer: {hire.freelancer_name}</p>
            <p className="text-muted">Amount: RM{hire.amount}</p>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              amount={hire.amount}
              hireId={hire.id}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </Card.Body>
      </Card>
    </Container>
  );
}