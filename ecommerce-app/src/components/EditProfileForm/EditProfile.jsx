import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile, updateUserAvatar } from '../../services/userService';
import { resolveAvatarUrl } from '../../utils/media';
import Button from '../common/Button';
import Input from '../common/Input';
import RegisterErrorMessage from '../RegisterErrorMessage/RegisterErrorMessage';
import './EditProfile.css';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditProfile() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [form, setForm] = useState({ name: "", email: "" });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorKind, setErrorKind] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarError, setAvatarError] = useState(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef(null);
    const objectUrlRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        getUserProfile(user.id)
        .then((profile) => {
            if (!cancelled) {
                setForm({ name: profile.name || "", email: profile.email || "" });
                setAvatarUrl(resolveAvatarUrl(profile.avatar));
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

    // Libera el object URL de la vista previa al desmontar o al reemplazarlo.
    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    const handleAvatarPick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            setAvatarError("La imagen debe ser JPG, PNG o WEBP");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setAvatarError("La imagen no debe pesar más de 2MB");
            return;
        }

        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const previewUrl = URL.createObjectURL(file);
        objectUrlRef.current = previewUrl;

        setAvatarError(null);
        setAvatarFile(file);
        setAvatarUrl(previewUrl);
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;

        setAvatarUploading(true);
        setAvatarError(null);

        try {
            const updatedUser = await updateUserAvatar(user.id, avatarFile);
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            setAvatarUrl(resolveAvatarUrl(updatedUser.avatar));
            setAvatarFile(null);
            updateUser({ avatar: updatedUser.avatar });
        } catch (err) {
            setAvatarError("No se pudo subir la foto. Intenta de nuevo.");
        } finally {
            setAvatarUploading(false);
        }
    };

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

            <div className="avatar-edit-section">
                <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="avatar-edit-preview"
                    width="96"
                    height="96"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    data-testid="edit-profile-avatar-input"
                    hidden
                />
                <div className="avatar-edit-actions">
                    <Button type="button" variant="secondary" onClick={handleAvatarPick}>
                        Cambiar foto
                    </Button>
                    {avatarFile && (
                        <Button
                            type="button"
                            variant="primary"
                            disabled={avatarUploading}
                            onClick={handleAvatarUpload}
                            data-testid="edit-profile-avatar-save"
                        >
                            {avatarUploading ? "Subiendo..." : "Guardar foto"}
                        </Button>
                    )}
                </div>
                {avatarError && (
                    <span className="field-error" data-testid="edit-profile-avatar-error">
                        {avatarError}
                    </span>
                )}
            </div>

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

