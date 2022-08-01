from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.core.files.storage import FileSystemStorage

# from contact.forms import UploadFileForm
from maptroid.models import World

def simple_upload(request, world_slug=None):
    if request.method == 'POST' and request.FILES['myfile']:
        myfile = request.FILES['myfile']
        fs = FileSystemStorage()
        filename = fs.save(f'uploads/{world_slug}/{myfile.name}', myfile)
        uploaded_file_url = fs.url(filename)
        return HttpResponseRedirect('?success=1')
    world = World.objects.get(slug=world_slug)
    return render(request, 'simple_upload.html', {'world': world})
