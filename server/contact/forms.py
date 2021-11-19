from django import forms
from unrest import schema

from contact.models import Message

@schema.register
class ContactForm(forms.ModelForm):
    user_can_POST = 'NEW'
    class Meta:
        model = Message
        fields = ['email', 'body']