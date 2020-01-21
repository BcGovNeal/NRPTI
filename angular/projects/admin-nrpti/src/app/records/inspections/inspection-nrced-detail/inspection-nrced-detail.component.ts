import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { takeUntil, catchError } from 'rxjs/operators';
import { InspectionNRCED } from '../../../../../../common/src/app/models/nrced/inspection-nrced';
import { Subject, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RecordComponent } from '../../utils/record-component';
import { DatePipe } from '@angular/common';
import { FactoryService } from '../../../services/factory.service';

@Component({
  selector: 'app-inspection-nrced-detail',
  templateUrl: './inspection-nrced-detail.component.html',
  styleUrls: ['./inspection-nrced-detail.component.scss']
})
export class InspectionNRCEDDetailComponent extends RecordComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();

  public isPublished: boolean;
  public publishStatusString: string;

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public factoryService: FactoryService,
    public changeDetectionRef: ChangeDetectorRef,
    public datePipe: DatePipe
  ) {
    super();
  }

  ngOnInit() {
    if (!this.data) {
      this.route.data.pipe(takeUntil(this.ngUnsubscribe)).subscribe((res: any) => {
        if (!res || !res.records) {
          alert("Uh-oh, couldn't load Order");
          this.router.navigate(['/']);
          return;
        }

        const records = res.records[0] && res.records[0].data && res.records[0].data.searchResults;

        this.data = records && records[0] && new InspectionNRCED(records[0]);

        this.changeDetectionRef.detectChanges();
      });
    }

    this.isPublished = this.isRecordPublished();
    this.publishStatusString = this.getPublishStatusString();
  }

  publish(): void {
    this.factoryService
      .publishRecord(this.data)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        catchError(error => {
          console.log('Publish error:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (!response) {
          return;
        }

        if (response.code === 409) {
          // object was already published
          return;
        }

        this.data = new InspectionNRCED(response);
        this.isPublished = this.isRecordPublished();
        this.publishStatusString = this.getPublishStatusString();

        this.changeDetectionRef.detectChanges();
      });
  }

  unPublish(): void {
    this.factoryService
      .unPublishRecord(this.data)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        catchError(error => {
          console.log('Unpublish error:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (!response) {
          return;
        }

        if (response.code === 409) {
          // object was already unpublished
          return;
        }

        this.data = new InspectionNRCED(response);
        this.isPublished = this.isRecordPublished();
        this.publishStatusString = this.getPublishStatusString();

        this.changeDetectionRef.detectChanges();
      });
  }

  isRecordPublished(): boolean {
    return this.data && this.data.read && this.data.read.includes('public');
  }

  getPublishStatusString(): string {
    if (!this.isPublished) {
      return 'Not Published';
    }

    return `Published on ${this.datePipe.transform(this.data.datePublished, 'mediumDate')}`;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}