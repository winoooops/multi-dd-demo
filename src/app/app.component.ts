import { CdkDragMove, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

interface QuestPlayer {
  id: number;
  name: string;
  class: string;
  description: string;
  status: boolean;
  // used for the drag preview
  isChosen?: boolean;
  isDragging?: boolean;
}

interface RowPosition {
  top: number;
  bottom: number;
  rowAt: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'D&D Party Tracker';

  // the current pointer y position
  pointerY: number | null = null;
  // the accumulated delta in each drag move
  draggingDelta: number | null = null;

  // the cached positions of each row, key is the QuestPlayer.id, value is the top and bottom positions
  rowPositions: Map<number, RowPosition> = new Map();

  rowHeight: number = 0;

  // the offset of the draggig clientY from the top of the current row which initiate the drag
  offset: number = 0;

  isCustomized: boolean = true;

  @ViewChild('ddContainer') ddContainer!: ElementRef<HTMLDivElement>;

  players: QuestPlayer[] = [
    { 
      id: 1, 
      name: 'Thorin Oakenshield', 
      class: 'Fighter', 
      description: 'Dwarf fighter with an ancestral battleaxe and a grudge against dragons', 
      status: true 
    },
    { 
      id: 2, 
      name: 'Elora Danan', 
      class: 'Druid', 
      description: 'Half-elf circle of the moon druid who can transform into powerful beasts', 
      status: true 
    },
    { 
      id: 3, 
      name: 'Merlin Ambrosius', 
      class: 'Wizard', 
      description: 'Human divination wizard specializing in time magic and prophecies', 
      status: false 
    },
    { 
      id: 4, 
      name: 'Vex\'ahlia', 
      class: 'Ranger', 
      description: 'Half-elf beast master with a bear companion and deadly aim', 
      status: true 
    },
    { 
      id: 5, 
      name: 'Grog Strongjaw', 
      class: 'Barbarian', 
      description: 'Goliath path of the berserker with incredible strength but low intelligence', 
      status: false 
    },
    { 
      id: 6, 
      name: 'Kaelin Firethorn', 
      class: 'Paladin', 
      description: 'Human paladin of the flame with a flaming sword and a passion for justice', 
      status: true 
    },
    { 
      id: 7, 
      name: 'Lirael Starborn', 
      class: 'Cleric', 
      description: 'Elf cleric who channels the power of the moon goddess', 
      status: true 
    },
    { 
      id: 8, 
      name: 'Borin Ironfist', 
      class: 'Rogue', 
      description: 'Dwarf rogue with nimble fingers and a sharp wit', 
      status: false 
    },
    { 
      id: 9, 
      name: 'Seraphina Quickstep', 
      class: 'Bard', 
      description: 'Halfling bard who inspires allies with song and story', 
      status: true 
    },
    { 
      id: 10, 
      name: 'Darius Stormrider', 
      class: 'Sorcerer', 
      description: 'Human sorcerer with tempestuous magic and a mysterious past', 
      status: false 
    },
  ]

  ngAfterViewInit() {
    this.cacheRowPositions();
  }

  get draggingPlayers() {
    return this.players.filter(player => player.isDragging);
  }

  toggleCustomiztion() {
    console.log(`before isCustomized: ${this.isCustomized}`);
    this.isCustomized = !this.isCustomized;
    console.log(`now isCustomized: ${this.isCustomized}`);
  }

  onDrop(event: CdkDragDrop<QuestPlayer[]>) {
    if(!this.isCustomized) {
      const { previousIndex, currentIndex } = event;
      moveItemInArray(this.players, previousIndex, currentIndex);
    } else {
      const length = this.draggingPlayers.length;
      const targetIndex = this.getCursorAtRow(this.pointerY);

      if(targetIndex === null) {
        return;
      }

      if(length === 1) {
        this.handleSingleDrop(event.previousIndex, event.currentIndex);
      } else {
        this.handleMultiDrop(targetIndex);
      }
    }

    this.players.forEach(player => player.isDragging = false);

    this.draggingDelta = null;
    this.pointerY = null;
    this.offset = 0;
    this.cacheRowPositions();
  }

  onDragStarted(event: CdkDragStart<QuestPlayer>) {
    const { source: { data, _dragRef }, event: e } = event;
    const rowIndex = this.getCursorAtRow((e as MouseEvent).clientY);
    if(rowIndex === null) {
      return;
    }
    this.offset = this.calculateOffset(rowIndex, (e as MouseEvent).clientY);
    _dragRef.setPreviewOffset({ x: 0, y: this.offset });

    if(!data.isChosen || !this.isCustomized) {
      data.isDragging = true;
    } else {
      this.players.forEach(player => player.isDragging = player.isChosen)
    }

    if(!this.isCustomized) {
      document.documentElement.style.setProperty('--drag-count', "1");
      return;
    }

    this.groupPlayers(rowIndex);
    // Update the placeholder count, which is used in css to set the height of the placeholder
    document.documentElement.style.setProperty('--drag-count', this.draggingPlayers.length.toString());
  }

  onDragMoved(event: CdkDragMove<QuestPlayer>) {
    const { distance, event: e } = event;
    this.pointerY = (e as MouseEvent).clientY;
    this.draggingDelta = distance.y;
  }

  onKeyDown(event: KeyboardEvent) {
    // console.log(event);
  }

  onPlayerClick(player: QuestPlayer) {
    player.isChosen = !player.isChosen;
  }

  getItemTransform(id: number) {
    if(this.draggingDelta === null || this.pointerY === null || !this.isCustomized) {
      return "";
    }

    const draggingRows = this.draggingPlayers;
    const headIndex = this.rowPositions.get(draggingRows[0].id)?.rowAt || 0;
    const length = draggingRows.length;
    const distance = length * this.rowHeight;
    const rowPosition = this.rowPositions.get(id) || { top: 0, bottom: 0, rowAt: 0 };

    if(length === 1 || !rowPosition.top || !rowPosition.bottom) {
      return "";
    }

    if(this.draggingDelta > 0) {
      // dragging down
      if(rowPosition.rowAt > headIndex && this.pointerY - this.offset + distance > rowPosition.top) {
        return `translateY(-${distance}px)`;
      }
    } else {
      // dragging up
      if(rowPosition.rowAt < headIndex && this.pointerY < rowPosition.bottom) {
        return `translateY(${distance}px)`;
      }
    }

    return "";
  }

  private cacheRowPositions() {

    requestAnimationFrame(() => {
      this.rowPositions.clear();
      const rows = this.ddContainer.nativeElement.querySelectorAll('.dd-table-body .dd-table-row');
      
      rows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        this.rowPositions.set(Number(row.id), {
          top: rect.top,
          bottom: rect.bottom,
          rowAt: index
        });
        this.rowHeight = this.rowHeight ? Math.max(this.rowHeight, rect.height) : rect.height;
      });
    });
  }

  private getCursorAtRow(y: number | null) {
    if(y === null) {
      return null;
    }

    for(const [index, rowPosition] of this.rowPositions.entries()) {
      if(y >= rowPosition.top && y <= rowPosition.bottom) {
        return rowPosition.rowAt;
      }
    }

    return null;
  }

  private calculateOffset(rowIndex: number, clientY: number) {
    const rowPosition = this.rowPositions.get(rowIndex) || { top: 0, bottom: 0, rowAt: 0 };
    if(!rowPosition.top || !rowPosition.bottom) {
      return 0;
    }

    return clientY - rowPosition.top;
  }
  

  private handleSingleDrop(from: number, to: number) {
    this.players.splice(to, 0, this.players.splice(from, 1)[0]);
    console.log(this.players.map(player => player.id));
  }

  private handleMultiDrop(to: number) {
    const draggingRows = this.draggingPlayers;
    const length = draggingRows.length;
    const headIndex = this.rowPositions.get(draggingRows[0].id)?.rowAt || 0;
    const tailIndex = this.rowPositions.get(draggingRows[length - 1].id)?.rowAt || 0;

    let steps = 0;

    if(to < headIndex) {
      // the group is being moved out of the selected group's original range to the top
      for(const player of draggingRows.reverse()) {
        const from = this.rowPositions.get(player.id)?.rowAt || 0;
        this.handleSingleDrop(from + steps, to);
        steps++;
      }
    } else if (to > tailIndex) {
      for(const player of draggingRows) {
        const from = this.rowPositions.get(player.id)?.rowAt || 0;
        this.handleSingleDrop(from-steps, to);
        steps++
      }
    } else{
      // the group is being moved within the selected group's original range 
      if(to !== headIndex) {
        for(const player of draggingRows) {
          this.handleSingleDrop(headIndex, to + length - 1);
          steps++;
        }
      }
    }
  }

  private groupPlayers(headIndex: number,) {
    let steps = 0;
    for(const player of this.draggingPlayers) {
      const from = this.rowPositions.get(player.id)?.rowAt || 0;
      if(from === headIndex) {
        steps++;
        continue;
      }
      this.handleSingleDrop(from, headIndex + steps);
      steps++;
    }
  }
}
