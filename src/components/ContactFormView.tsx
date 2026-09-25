import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { api } from '../api';

interface ContactFormViewProps {
  contactToEdit?: Contact | null;
  onCancel: () => void;
  onSaved: (contact: Contact) => void;
}

export const ContactFormView: React.FC<ContactFormViewProps> = ({
  contactToEdit,
  onCancel,
  onSaved,
}) => {
  const isEditing = !!contactToEdit;

  const [fullName, setFullName] = useState(contactToEdit?.name || '');
  const [email, setEmail] = useState(contactToEdit?.email || '');
  const [phone, setPhone] = useState(contactToEdit?.phone || '');
  const [category, setCategory] = useState(contactToEdit?.category || 'Personal');
  const [jobTitle, setJobTitle] = useState(contactToEdit?.job_title || '');
  const [address, setAddress] = useState(contactToEdit?.address || '');
  const [tags, setTags] = useState(contactToEdit?.tags || '');
  const [isKeyAccount, setIsKeyAccount] = useState(contactToEdit?.is_key_account === 1);

  // Email validation state matching Image 8
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate email format
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  };

  const showEmailError = emailTouched && email.trim().length > 0 && !isValidEmail(email);

  useEffect(() => {
    if (contactToEdit) {
      setFullName(contactToEdit.name);
      setEmail(contactToEdit.email);
      setPhone(contactToEdit.phone || '');
      setCategory(contactToEdit.category || 'Client');
      setJobTitle(contactToEdit.job_title || '');
      setAddress(contactToEdit.address || '');
      setTags(contactToEdit.tags || '');
      setIsKeyAccount(contactToEdit.is_key_account === 1);
    }
  }, [contactToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload: Partial<Contact> = {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        category,
        job_title: jobTitle.trim(),
        address: address.trim(),
        tags: tags.trim(),
        is_key_account: isKeyAccount ? 1 : 0,
      };

      if (isEditing && contactToEdit) {
        const res = await api.updateContact(contactToEdit.id, payload);
        if (res.success && res.data) {
          onSaved(res.data);
        } else {
          setErrorMsg('Failed to update contact in C++ database.');
        }
      } else {
        const res = await api.createContact(payload);
        if (res.success && res.data) {
          onSaved(res.data);
        } else {
          setErrorMsg('Failed to create contact in C++ database.');
        }
      }
    } catch (err: any) {
      console.error('Error saving contact:', err);
      setErrorMsg(err.message || 'Error communicating with C++ backend.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 md:p-4 max-w-[800px] w-full mx-auto">
      {/* Breadcrumbs & Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#505f76] text-[14px] mb-1">
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-[#004ac6] transition-colors cursor-pointer"
          >
            Contacts
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#111c2d] font-medium">
            {isEditing ? 'Edit Contact' : 'Add New'}
          </span>
        </div>
        <h1 className="font-headline text-[32px] md:text-[36px] leading-[40px] md:leading-[44px] font-bold text-[#111c2d]">
          {isEditing ? 'Edit Contact' : 'Add Contact'}
        </h1>
        <p className="text-[14px] leading-[20px] text-[#505f76] mt-1">
          {isEditing
            ? 'Update contact record in real-time C++ WAL storage.'
            : 'Create a new entry in your address book.'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/30 flex items-center gap-3 text-[14px]">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
          <h3 className="font-headline text-[20px] font-semibold text-[#111c2d] mb-4 pb-3 border-b border-[#f0f3ff]">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Full Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="fullName">
                Full Name <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full h-[40px] px-3.5 bg-white border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="email">
                Email Address <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="jane@example.com"
                required
                className={`w-full h-[40px] px-3.5 bg-white border rounded-lg text-[14px] transition-colors focus:outline-none ${
                  showEmailError
                    ? 'border-[#ba1a1a] text-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                    : 'border-[#c3c6d7] text-[#111c2d] focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]'
                }`}
              />
              {/* Validation Feedback matching Image 8 */}
              {showEmailError && (
                <div className="text-[#ba1a1a] text-[12px] mt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>Please enter a valid email address.</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full h-[40px] px-3.5 bg-white border border-[#c3c6d7] rounded-lg text-[14px] font-mono text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Additional Details */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-6 shadow-xs">
          <h3 className="font-headline text-[20px] font-semibold text-[#111c2d] mb-4 pb-3 border-b border-[#f0f3ff]">
            Additional Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Category Dropdown */}
            <div>
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="category">
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-[40px] pl-3.5 pr-8 bg-white border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] appearance-none focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors cursor-pointer"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Family">Family</option>
                  <option value="Client">Client</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Partner">Partner</option>
                  <option value="Internal">Internal</option>
                  <option value="Other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#505f76]">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="jobTitle">
                Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full h-[40px] px-3.5 bg-white border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors"
              />
            </div>

            {/* Tags */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="tags">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. VIP, Priority, Q3 Expansion"
                className="w-full h-[40px] px-3.5 bg-white border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors"
              />
            </div>

            {/* Key Account checkbox */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 pt-1">
              <input
                id="keyAccount"
                type="checkbox"
                checked={isKeyAccount}
                onChange={(e) => setIsKeyAccount(e.target.checked)}
                className="w-4 h-4 text-[#004ac6] rounded border-[#c3c6d7] focus:ring-[#004ac6] cursor-pointer"
              />
              <label htmlFor="keyAccount" className="text-[14px] text-[#111c2d] cursor-pointer font-medium">
                Mark as Key Account (Executive Priority)
              </label>
            </div>

            {/* Physical Address */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[14px] font-medium text-[#111c2d] mb-1.5 block" htmlFor="address">
                Physical Address
              </label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St..."
                className="w-full p-3.5 bg-white border border-[#c3c6d7] rounded-lg text-[14px] text-[#111c2d] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-[14px] font-medium text-[#505f76] hover:bg-[#e7eeff] transition-colors rounded-lg active:translate-y-px cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-[14px] font-medium bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors rounded-lg shadow-xs active:translate-y-px flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{submitting ? 'Saving to C++ Core...' : 'Save Contact'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
