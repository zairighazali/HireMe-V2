import { useState, useEffect, useCallback } from "react";
import { Modal, Button, ListGroup, Badge, Spinner } from "react-bootstrap";
import { authFetch } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function JobInterestsModal({ show, onHide, jobId, onHired }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
   const navigate = useNavigate();

  // ===== FETCH INTERESTS =====
  const fetchInterests = useCallback(async () => {
    if (!jobId) return;

    setFetching(true);
    try {
      const response = await authFetch(`/api/jobs/${jobId}/interests`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch interests");
      }

      const respData = await response.json();
      // Ambil array dari data field
      setInterests(respData.data || []);
    } catch (error) {
      console.error("Failed to fetch interests:", error);
      setInterests([]);
    } finally {
      setFetching(false);
    }
  }, [jobId]);

  // ===== LOAD WHEN OPEN =====
  useEffect(() => {
    if (show) {
      fetchInterests();
    } else {
      setInterests([]);
    }
  }, [show, fetchInterests]);

  // ===== HIRE FREELANCER =====
  const handleHire = async (interestId, freelancerUid) => {
    if (!confirm("Are you sure you want to hire this freelancer?")) return;

    setLoading(true);
    try {
      const response = await authFetch(`/api/jobs/${jobId}/hire`, {
        method: "POST",
        body: JSON.stringify({
          interest_id: interestId,
          freelancer_uid: freelancerUid,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to hire freelancer");
      }

      const updatedJob = await response.json();
      onHired?.(updatedJob);
      onHide();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Interested Freelancers</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {fetching ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : interests.length === 0 ? (
          <p className="text-muted mb-0">
            No freelancers have shown interest yet.
          </p>
        ) : (
          <ListGroup>
            {interests.map((interest) => (
              <ListGroup.Item
                key={interest.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <div className="fw-bold">
                    {interest.freelancer_name || "Unknown Freelancer"}
                  </div>

                  {interest.freelancer_email && (
                    <div className="text-muted small">
                      {interest.freelancer_email}
                    </div>
                  )}

                  {interest.message && (
                    <div className="mt-1">
                      <Badge bg="info" className="me-1">
                        Message
                      </Badge>
                      {interest.message}
                    </div>
                  )}

                  {interest.status && interest.status !== "pending" && (
                    <div className="mt-1">
                      <Badge bg="secondary">
                        {interest.status.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      navigate(`/freelancer/${interest.freelancer_uid}`);
                      onHide(); // tutup modal
                    }}
                  >
                    View Profile
                  </Button>

                  <Button
                    variant="success"
                    size="sm"
                    disabled={loading || interest.status !== "pending"}
                    onClick={() =>
                      handleHire(interest.id, interest.freelancer_uid)
                    }
                  >
                    Hire
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
