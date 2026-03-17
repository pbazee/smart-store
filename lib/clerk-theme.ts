export const clerkAuthAppearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    showOptionalFields: true,
  },
  elements: {
    rootBox: "w-full",
    card: "w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsRoot: "mb-7 grid gap-4",
    socialButtonsBlockButton:
      "min-h-16 rounded-[1.6rem] border-2 border-emerald-500/70 bg-white px-5 text-slate-950 shadow-[0_18px_44px_rgba(249,115,22,0.26)] transition-all duration-200 hover:scale-[1.02] hover:border-emerald-600 hover:bg-orange-50 hover:shadow-[0_24px_54px_rgba(249,115,22,0.3)]",
    socialButtonsBlockButtonText: "text-base font-black text-slate-950",
    socialButtonsProviderIcon: "h-5 w-5",
    formButtonPrimary:
      "mt-2 h-12 rounded-[1.1rem] bg-orange-500 text-sm font-bold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-colors hover:bg-orange-600",
    formFieldInput:
      "h-12 rounded-[1.1rem] border border-white/12 bg-black/35 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20",
    formFieldLabel: "text-sm font-medium text-white/88",
    formFieldHintText: "text-xs text-white/55",
    formFieldWarningText: "text-xs font-medium text-amber-200",
    formFieldSuccessText: "text-emerald-300",
    formFieldErrorText: "text-rose-300",
    dividerRow: "my-7",
    dividerLine: "bg-white/12",
    dividerText: "text-[11px] font-bold uppercase tracking-[0.24em] text-white/72",
    footer: "hidden",
    footerAction: "text-sm",
    footerActionText: "text-white/55",
    footerActionLink: "font-semibold text-orange-300 hover:text-orange-200",
    alert: "rounded-[1.1rem] border border-rose-400/30 bg-rose-500/10 text-rose-100",
    otpCodeFieldInput:
      "h-12 w-12 rounded-[1.1rem] border border-white/12 bg-black/35 text-white",
    identityPreviewText: "text-white/70",
    formResendCodeLink: "text-orange-300 hover:text-orange-200",
    formResendCodeLinkButton: "text-orange-300 hover:text-orange-200",
    alternativeMethodsBlockButton:
      "rounded-[1.1rem] border border-white/12 bg-black/20 text-white transition-colors hover:bg-white/10",
    alternativeMethodsBlockButtonText: "text-sm font-semibold text-white",
  },
} as const;

export const clerkAuthLocalization = {
  dividerText: "Or continue with email",
  socialButtonsBlockButton: "Continue with {{provider}}",
} as const;
