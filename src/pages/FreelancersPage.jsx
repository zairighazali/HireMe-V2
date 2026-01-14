import { useState, useEffect } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import FreelancerCard from "../components/FreelancerCard";

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/freelancers`);
      if (response.ok) {
        const data = await response.json();
        setFreelancers(data);
      }
    } catch (error) {
      console.error("Failed to fetch freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = freelancers.filter(freelancer =>
    freelancer.name?.toLowerCase().includes(search.toLowerCase()) ||
    freelancer.skills?.toLowerCase().includes(search.toLowerCase()) ||
    freelancer.bio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-4">
      <h2 className="mb-4">Find Freelancers</h2>

      <Form.Control
        type="text"
        placeholder="Search freelancers by name, skills, or bio..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {loading ? (
        <p>Loading freelancers...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">No freelancers found matching your search.</p>
      ) : (
        <Row>
          {filtered.map((freelancer) => (
            <Col md={6} lg={4} key={freelancer.uid} className="mb-4">
              <FreelancerCard freelancer={freelancer} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}