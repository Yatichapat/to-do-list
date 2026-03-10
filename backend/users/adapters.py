from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):

    def save_user(self, request, sociallogin, form=None):

        user = super().save_user(request, sociallogin, form)

        data = sociallogin.account.extra_data

        user.email = data.get("email", "")
        user.username = user.email

        user.save()

        return user