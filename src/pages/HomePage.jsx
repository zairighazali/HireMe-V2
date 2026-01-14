import { Container, Carousel, Form, Row, Col, Card } from "react-bootstrap";
import { useState, useEffect } from "react";
import FreelancerCard from "../components/FreelancerCard";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [freelancers, setFreelancers] = useState([]);
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
    <>
      {/* Carousel */}
      <Carousel>
        <Carousel.Item>
          <img className="d-block w-100" src="https://via.placeholder.com/1200x400" />
        </Carousel.Item>
      </Carousel>

      {/* Hero */}
      <Container className="container text-center text-black">
          <h1 className="fw-bold display-5">
            Hire <span className="text-primary">top freelancers</span> in minutes
          </h1>

          <p className="fs-5 mb-4 opacity-75">
            Search, hire, and work with skilled professionals.
          </p>

        <Form.Control
          placeholder="Search freelancer by skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="small mt-3 opacity-50">
            Example searches: Web Developer, Graphic Designer, Musician
          </p>
      </Container>

      {/* Search Result */}
      <Container>
        <h3 className="mb-4">Available Freelancers</h3>
        {loading ? (
          <p>Loading freelancers...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">No freelancers found matching your search.</p>
        ) : (
          <Row>
            {filtered.map((freelancer) => (
              <Col md={4} key={freelancer.uid} className="mb-4">
                <FreelancerCard freelancer={freelancer} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}
