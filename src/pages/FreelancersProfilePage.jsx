import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authFetch } from "../services/api";

export default function FreelancerProfilePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // cek login
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  // 🔹 Fetch freelancer profile (public untuk guest, authFetch kalau logged in optional)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (user?.uid) {
          // Logged in → pakai authFetch
          res = await authFetch(`/api/users/${uid}`);
        } else {
          // Guest → public endpoint
          const url = `${import.meta.env.VITE_API_URL}/api/users/public/${uid}`;
          res = await fetch(url);
        }

        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        setProfile({
          ...data,
          skills:
            typeof data.skills === "string"
              ? data.skills
              : Array.isArray(data.skills)
              ? data.skills.join(", ")
              : "",
        });
      } catch (err) {
        console.error("Failed to fetch freelancer profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [uid, user]);

  // 🔹 Start chat (hanya jika logged in)
  const handleChat = async () => {
    if (!user?.uid) return alert("You must be logged in to start chat");
    if (!profile?.firebase_uid) return alert("Freelancer UID not found");
    if (chatLoading) return;

    setChatLoading(true);
    try {
      const res = await authFetch(`/api/conversations/start`, {
        method: "POST",
        body: JSON.stringify({ otherUid: profile.firebase_uid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to start chat");
      }

      const data = await res.json();
      if (!data?.conversation?.id) throw new Error("Conversation ID not returned");

      navigate(`/messages/${data.conversation.id}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("Cannot start chat: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );

  if (!profile)
    return <p className="text-center text-muted">Freelancer not found</p>;

  return (
    <Container className="pt-5 mt-4">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="p-4 align-items-center text-center">
            <img
              src={profile.image_url || "https://via.placeholder.com/120"}
              width={120}
              height={120}
              className="rounded-circle mb-3"
            />
            <h4>{profile.name || "Unnamed Freelancer"}</h4>
            <p className="text-muted">{profile.skills || "No skills listed"}</p>
            <p>{profile.bio || "No bio provided"}</p>

            <div className="d-flex gap-2 justify-content-center mt-3">
              <Button
                variant="primary"
                onClick={handleChat}
                disabled={chatLoading || !user?.uid}
                title={!user?.uid ? "Login to start chat" : ""}
              >
                {chatLoading ? "Opening..." : "Chat"}
              </Button>

              <Button variant="secondary" onClick={() => navigate(-1)}>
                Back
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
