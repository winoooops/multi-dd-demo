import { CdkDragMove, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ViewChild, ElementRef } from '@angular/core';

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


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'D&D Party Tracker';

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
    }
  ]

  get draggingPlayers() {
    return this.players.filter(player => player.isDragging);
  }

  onDrop(event: CdkDragDrop<QuestPlayer[]>) {
    moveItemInArray(this.players, event.previousIndex, event.currentIndex);
    this.players.forEach(player => player.isDragging = false);
  }

  onDragStarted(event: CdkDragStart<QuestPlayer>) {
    const { source: { data } } = event;
    if(!data.isChosen) {
      data.isDragging = true;
    } else {
      this.players.forEach(player => player.isDragging = player.isChosen)
    }

    // Update the placeholder count, which is used in css to set the height of the placeholder
    document.documentElement.style.setProperty('--drag-count', this.draggingPlayers.length.toString());
  }

  onDragMoved(event: CdkDragMove<QuestPlayer>) {
    // console.log(event);
  }

  onKeyDown(event: KeyboardEvent) {
    // console.log(event);
  }

  onPlayerClick(player: QuestPlayer) {
    console.log(player);
    player.isChosen = !player.isChosen;
  }
}
