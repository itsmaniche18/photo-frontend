import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranscribeStreamingClient } from '@aws-sdk/client-transcribe-streaming';
import { Observable, ReplaySubject } from 'rxjs';
declare var webkitSpeechRecognition: any;
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'my-app';
  public searchInput = '';
  private recognition = new webkitSpeechRecognition();
  private transcribe = new TranscribeStreamingClient({ region: 'us-east-1' });
  images: any;
  apiUrl = `https://jv4nrxx977.execute-api.us-east-1.amazonaws.com/prod/test`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private ngxService: NgxUiLoaderService
  ) {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[
        event.resultIndex
      ] as SpeechRecognitionResult;
      const transcript = result[0].transcript;
      this.searchInput = transcript;
    };
  }

  startRecognition() {
    this.recognition.start();
  }

  stopRecognition() {
    this.recognition.stop();
  }

  search() {
    this.ngxService.start();
    const query = this.searchInput;
    const url = `https://jv4nrxx977.execute-api.us-east-1.amazonaws.com/prod/search?q=${encodeURIComponent(
      query
    )}`;
    this.http.get(url).subscribe({
      next: (data) => {
        this.images = data;
        this.ngxService.stop();
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.ngxService.stop();
      },
    });
  }

  convertFile(file: File): Observable<string> {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (event: any) =>
      result.next(btoa(event.target.result.toString()));
    return result;
  }

  handleUpload(event: any) {
    this.ngxService.start();
    const file = event.target.files[0];
    if (file) {
      this.convertFile(file).subscribe((base64) => {
        const payload = {
          name: file.name,
          type: file.type,
          file: `data:${file.type};base64,${base64}`,
        };
        this.uploadToS3(payload);
      });
    }
  }
  uploadToS3(payload: any) {
    this.http
      .put(this.apiUrl, payload, {
        headers: {
          'X-Api-Key': 'NWbfSbtcWd2ZqRxKBD8YA1qT9lMB80aLxaOVSEqf',
        },
      })
      .subscribe({
        next: (data: any) => {
          console.log('Image uploaded successfully:', data);
          this.ngxService.stop();
          this.toastr.success(data);
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.ngxService.stop();
        },
      });
  }
}
