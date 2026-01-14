import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Modal,
  Form,
} from "react-bootstrap";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { uploadFile } from "../utils/storage";
import HiredFreelancerCard from "../components/Freelancers/HiredFreelancerCard";
import { authFetch } from "../services/api";

export default function UserProfile() {
  const { user } = useAuth();
  const firebaseUser = user;

  const API = import.meta.env.VITE_API_URL;

  const [showEdit, setShowEdit] = useState(false);
  const [profile, setProfile] = useState({});
  const [peopleIHired, setPeopleIHired] = useState([]);
  const [jobsOfferedToMe, setJobsOfferedToMe] = useState([]);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // 🔹 FETCH HIRES
  const fetchHires = useCallback(async () => {
    if (!firebaseUser?.uid) return;

    try {
      const token = await firebaseUser.getIdToken(true);

      const [iHiredRes, offeredToMeRes] = await Promise.all([
        fetch(`${API}/hires/i-hired`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/hires/offered-to-me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPeopleIHired((await iHiredRes.json()) || []);
      setJobsOfferedToMe((await offeredToMeRes.json()) || []);
    } catch (err) {
      console.error("Failed to fetch hires:", err);
    }
  }, [firebaseUser, API]);

  // 🔹 FETCH PROFILE
  useEffect(() => {
  if (!firebaseUser?.uid) return;

  const fetchProfile = async () => {
    try {
      const token = await firebaseUser.getIdToken(true);
      console.log("Fetched token:", token);

      const res = await authFetch(`/api/users/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

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

      setImagePreview(data.image_url || "");

      // Fetch hires selepas profile berjaya
      fetchHires();
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  fetchProfile();
}, [firebaseUser, API, fetchHires]);



  // 🔹 IMAGE UPLOAD
  const handleImageUpload = async (file) => {
    if (!file || !firebaseUser?.uid) {
      alert("No file selected or user not logged in");
      return;
    }

    setUploading(true);

    try {
      const url = await uploadFile(file, `profilePhotos/${firebaseUser.uid}`);
      setProfile((prev) => ({ ...prev, image_url: url }));
      setImagePreview(url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 SAVE PROFILE
  const handleSaveProfile = async () => {
  if (!firebaseUser?.uid) return;

  setUploading(true);

  try {
    const token = await firebaseUser.getIdToken(true);

    const res = await authFetch(`/api/users/me`, {
      method: "PUT",
      body: JSON.stringify({
        name: profile.name || "Unnamed User",
        skills: profile.skills || "",
        bio: profile.bio || "",
        image_url: profile.image_url || null,
      }),
    });

    if (!res.ok) throw new Error("Failed to save profile");

    const updated = await res.json();
    setProfile(updated);
    setShowEdit(false);
  } catch (err) {
    console.error("Failed to save profile:", err);
    alert("Failed to save profile: " + err.message);
  } finally {
    setUploading(false);
  }
};
  return (
    <Container className="pt-5 mt-4">
      <Row className="g-4">
        {/* LEFT */}
        <Col md={6}>
          <Card className="p-4 align-items-center text-center">
            <img
              src={imagePreview || "https://via.placeholder.com/120"}
              width={120}
              height={120}
              className="rounded-circle mb-3"
            />
            <h4>{profile.name || firebaseUser.displayName}</h4>
            <p className="text-muted">{profile.skills || "Your skills"}</p>
            <p>{profile.bio || "Your bio"}</p>
            <Button onClick={() => setShowEdit(true)}>Edit Profile</Button>
          </Card>
        </Col>

        {/* RIGHT */}
        <Col md={6}>
          <h4>People I Hired</h4>
          {peopleIHired.length === 0 && <p className="text-muted">None yet</p>}
          {peopleIHired.map((h) => (
            <HiredFreelancerCard key={h.id} hire={h} refresh={fetchHires} />
          ))}

          <hr />

          <h4>Jobs Offered To Me</h4>
          {jobsOfferedToMe.length === 0 && (
            <p className="text-muted">No jobs yet</p>
          )}
          {jobsOfferedToMe.map((h) => (
            <HiredFreelancerCard key={h.id} hire={h} refresh={fetchHires} />
          ))}
        </Col>
      </Row>

      {/* EDIT MODAL */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <img
              src={imagePreview || "https://via.placeholder.com/100"}
              width={100}
              height={100}
              className="rounded-circle mb-3"
            />
            <Form.Control
              type="file"
              onChange={(e) => handleImageUpload(e.target.files[0])}
            />
            <Form.Control
              className="mt-3"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Form.Control
              className="mt-2"
              value={profile.skills || ""}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            />
            <Form.Control
              className="mt-2"
              as="textarea"
              rows={4}
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSaveProfile} disabled={uploading}>
            {uploading ? "Uploading..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}