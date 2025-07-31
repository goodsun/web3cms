import React, { useState, useEffect } from 'react';

const GenericForm = ({
  fields,
  initialData,
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  className = '',
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Initialize with default values
      const defaults = {};
      fields.forEach(field => {
        defaults[field.name] = field.defaultValue || '';
      });
      setFormData(defaults);
    }
  }, [initialData, fields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.validation) {
        const error = field.validation(formData[field.name], formData);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: `form-input ${errors[field.name] ? 'error' : ''}`,
      placeholder: field.placeholder,
      required: field.required,
      disabled: field.disabled,
    };

    switch (field.type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 4}
          />
        );

      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={formData[field.name] || false}
            className="form-checkbox"
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={field.type || 'text'}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`generic-form ${className}`}>
      {fields.map(field => (
        <div key={field.name} className={`form-group ${field.type === 'checkbox' ? 'checkbox-group' : ''}`}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <span className="error-message">{errors[field.name]}</span>
          )}
          {field.hint && (
            <span className="field-hint">{field.hint}</span>
          )}
        </div>
      ))}
      
      <div className="form-buttons">
        <button type="submit" className="btn btn-primary">
          {submitText}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
        )}
      </div>
    </form>
  );
};

export default GenericForm;