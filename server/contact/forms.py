from django import forms
import unrest_schema

from contact.models import Message

@unrest_schema.register
class ContactForm(forms.ModelForm):
    user_can_POST = 'NEW'
    class Meta:
        model = Message
        fields = ['email', 'body']