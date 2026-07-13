import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../services/userService";
import Button from "../common/Button";
import Input from "../common/Input";
import RegisterErrorMessage from "../RegisterErrorMessage/RegisterErrorMessage";
import "./ChangePassword.css";

export default function ChangePassword() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [form, setForm] = useState({ 
        currentPassword: "",
        newPassword: "",
        confirmedPassword: "",
    });
    const [errorKind, setErrorKind] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));

        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const validate = (form) => {
        const errors = {};

        if (!form.currentPassword.trim()) {
            errors.currentPassword = "Current password is required";
        }

        if (!form.newPassword.trim()) {
            errors.newPassword = "New password is required";
        } else if (form.newPassword.trim().length < 6) {
            errors.newPassword = "New password must be at least 6 characters";
        }

        if (form.confirmedPassword !== form.newPassword){
            errors.confirmedPassword = "Passwords do not match";
        }

        return errors;
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        const errors = validate(form);

        if (Object.keys(errors).length > 0){
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setErrorKind(null);
        setLoading(true);

        try {
            await changePassword(user.id, {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            navigate("/profile");
        } catch (err) {
            handleChangePasswordError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePasswordError = (err) => {
        const kind = err.kind || "UNKNOWN";

        if (kind === "CLIENT_ERROR" && err.status === 400) {
            const backendMessage = err.original?.response?.data?.message;
            if (backendMessage === "Current password is incorrect") {
                setFieldErrors({ currentPassword: "Current password is incorrect" });
                return;
            }
            setErrorKind("BAD_REQUEST");
            return;
        }

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

    return (
        <div className="change-password-container">
            <div className="change-password-card">
                <h2>Change Password</h2>

                <form 
                className="change-password-form"
                onSubmit={onSubmit}
                noValidate
                data-testid="change-password-form"
            >
                <div className="form-group">
                    <Input
                        id="currentPassword"
                        type="password"
                        label="Current Password"
                        value={form.currentPassword}
                        onChange={handleChange("currentPassword")}
                        data-testid="change-password-current-input"
                    />
                    {fieldErrors.currentPassword && (
                        <span className="field-error" data-testid="change-password-current-error">
                            {fieldErrors.currentPassword}
                        </span>
                    )}
                </div>
                <div className="form-group">
                    <Input
                        id="newPassword"
                        label="New Password"
                        type="password"
                        value={form.newPassword}
                        onChange={handleChange("newPassword")}
                        data-testid="change-password-new-input"
                    />
                    {fieldErrors.newPassword && (
                        <span className="field-error" data-testid="change-password-new-error">
                            {fieldErrors.newPassword}
                        </span>
                    )}
                </div>
                <div className="form-group">
                    <Input
                        id="confirmedPassword"
                        label="Confirm New Password"
                        type="password"
                        value={form.confirmedPassword}
                        onChange={handleChange("confirmedPassword")}
                        data-testid="change-password-confirm-input"
                    />
                    {fieldErrors.confirmedPassword && (
                        <span className="field-error" data-testid="change-password-confirm-error">
                            {fieldErrors.confirmedPassword}
                        </span>
                    )}
                </div>

                {errorKind && <RegisterErrorMessage kind={errorKind} />}

                <Button
                disabled={loading}
                type="submit"
                variant="primary"
                data-testid="change-password-submit-button"
                >
                    {loading ? "Updating..." : "Change password"}
                </Button>
            </form>
        </div>
    </div>    
    );
}