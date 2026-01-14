import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function FreelancerCard({ freelancer }) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex align-items-center mb-2">
          <img
            src={freelancer.image_url || "https://via.placeholder.com/50"}
            alt={freelancer.name}
            className="rounded-circle me-3"
            width={50}
            height={50}
          />
          <div>
            <Card.Title className="mb-0">{freelancer.name}</Card.Title>
            <Card.Subtitle className="text-muted">
              {freelancer.email}
            </Card.Subtitle>
          </div>
        </div>

        <Card.Text>{freelancer.bio || "No bio available"}</Card.Text>

        {freelancer.skills && (
          <div className="mb-2">
            <strong>Skills:</strong>{" "}
            {Array.isArray(freelancer.skills)
              ? freelancer.skills.map((skill, index) => (
                  <Badge key={index} bg="secondary" className="me-1">
                    {skill}
                  </Badge>
                ))
              : freelancer.skills.split(",").map((skill, index) => (
                  <Badge key={index} bg="secondary" className="me-1">
                    {skill.trim()}
                  </Badge>
                ))}
          </div>
        )}

        <div className="d-flex gap-2">
          <Button as={Link} to={`/profile/${freelancer.uid}`} variant="outline-primary" size="sm">
            View Profile
          </Button>
          <Button variant="primary" size="sm">
            Contact
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}