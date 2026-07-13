import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import Button from '../common/Button';
import Input from '../common/Input';
import RegisterErrorMessage from '../RegisterErrorMessage/RegisterErrorMessage';
import './EditProfile.css';

export default function EditProfile() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [form, setForm] = useState({ name: "", email: "" });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorKind, setErrorKind] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        let cancelled = false;

        getUserProfile(user.id)
        .then((profile) => {
            if (!cancelled) {
                setForm({ name: profile.name || "", email: profile.email || "" });
            }
        })
        .catch(() => {
            if (!cancelled) setErrorKind("UNKNOWN");
        })
        .finally(() => {
            if (!cancelled) setLoadingProfile(false);
        });
        
        return () => {
            cancelled = true;
        };
    }, [user.id]);

    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [ field]: event.target.value }));

        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const validate = (form) => {
        const errors = {};

        if (!form.name.trim()) {
            errors.name = "Name is required";
        } else if (form.name.trim().length < 3) {
            errors.name = "Name must be at least 3 characters";
        }

        if (!form.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            errors.email = "Email does not have a valid format";
        }
        return errors;
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        const errors = validate(form);

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setErrorKind(null);
        setLoading(true);

        try {
            await updateUserProfile(user.id, { name: form.name, email: form.email });
            updateUser({ name: form.name });
            navigate("/profile");
        } catch (err) {
            handleUpdateError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateError = (err) => {
        const kind = err.kind || "UNKNOWN";

        if (kind === "VALIDATION" && err.fields) {
            const errors = {};
            err.fields.forEach((f) => {
                errors[f.path || f.param] = f.msg;
            });
            setFieldErrors(errors);
            return;
        }

        setErrorKind(kind);
    };

    if (loadingProfile) {
        return (
            <div className = "edit-profile-container">
                <div className = "edit-profile-card">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className = "edit-profile-container">
            <div className = "edit-profile-card">
                <h2>Edit Profile</h2>
            
            <form
            className = "edit-profile-form" 
            onSubmit={onSubmit}
            noValidate
            data-testid = "edit-profile-form"
            >
                <div className="form-group">
                    <Input
                    id="name"
                    label="Name"
                    type="text"
                    value={form.name}
                    onChange={handleChange("name")}
                    data-testid="edit-profile-name-input"
                    />
                    {fieldErrors.name && (
                        <span className="field-error" data-testid="edit-profile-name-error">
                            {fieldErrors.name}
                        </span>
                    )}
                </div>

                <div className="form-group">
                    <Input
                    id="email"
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    data-testid="edit-profile-email-input"
                    />
                    {fieldErrors.email && (
                        <span className="field-error" data-testid="edit-profile-email-error">
                            {fieldErrors.email}
                        </span>
                    )}
                </div>

                {errorKind && <RegisterErrorMessage kind={errorKind} />}

                <Button
                    disabled={loading}
                    type="submit"
                    variant="primary"
                    data-testid="edit-profile-submit-button"
                >
                    {loading ? "Updating..." : "Update Profile"}
                </Button>                
            </form>
        </div>
    </div>
    );
}

