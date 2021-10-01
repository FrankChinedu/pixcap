// class 
interface IEmployee {
  uniqueId: number;
  name: string;
  subordinates: IEmployee[]
  supervisor: number
}

interface IEmployees {
  key?: IEmployee[]
}

interface AppState {
  [key: number]: {
    supervisor: number | null,
    subordinates: number[]
  }
}

type AppHistoryContent = [string|number, AppState]
type AppHistory = AppHistoryContent[]

interface IEmployeeOrgApp {
  ceo: IEmployee

  move(employeeID: number, supervisorID: number): void;

  undo(): void;

  redo(): void;
}

class Employee implements IEmployee {
  static lastIndex = 0
  uniqueId: number;
  name: string;
  subordinates: IEmployee[] = [];
  supervisor = null;

  constructor(name: string) {
    this.name = name;
    this.uniqueId = Employee.lastIndex + 1;
    Employee.lastIndex = this.uniqueId
  }
}

const Mark = 'Mark Zuckerberg';
const Sarah = 'Sarah Donald';
const Tyler = 'Tyler Simpson';
const Bruce = 'Bruce Willis';
const Georgina = 'Georgina Flangy';
const Cassandra = 'Cassandra Reynolds';
const Mary = 'Mary Blue';
const Tina = 'Tina Teff';
const Will = 'Will Turner';
const Harry = 'Harry Tobs';
const Thomas = 'Thomas Brown';
const George = 'George Carrey';
const Gary = 'Gary Styles';
const Sophie = 'Sophie Turner';
const Bob = 'Bob Saget:';

const employeeNameLists = [
  Sarah, Tyler, Bruce, Georgina, Cassandra, Mary, Tina, Will,
  Harry, Thomas, George, Gary, Sophie, Bob
];

const subordinateTree: {supervisor: string, employee: string}[] = [
  {supervisor: Mark,  employee: Sarah},
  {supervisor: Mark,  employee: Tyler},
  {supervisor: Mark,  employee: Bruce},
  {supervisor: Mark,  employee: Georgina},
  {supervisor: Sarah,  employee: Cassandra},
  {supervisor: Cassandra,  employee: Mary},
  {supervisor: Cassandra,  employee: Bob},
  {supervisor: Bob,  employee: Tina},
  {supervisor: Tina,  employee: Will},
  {supervisor: Tyler,  employee: Harry},
  {supervisor: Tyler,  employee: George},
  {supervisor: Tyler,  employee: Gary},
  {supervisor: Harry,  employee: Thomas},
  {supervisor: Georgina,  employee: Sophie},
]

class EmployeeOrgApp implements IEmployeeOrgApp {
  ceo: IEmployee;
  private employees: IEmployees = {};
  private history: AppHistory = []
  private historyIndex = 0
  private state: AppState = {} 

  constructor(ceo: IEmployee) {
    this.ceo = ceo;
    this.employees = {[ceo.uniqueId]: ceo};
    this.state[ceo.uniqueId] = { 
      supervisor: null,
      subordinates: []
     };
    employeeNameLists.forEach(name => {
      this.addEmployee(name);
    })
    this.instantiateSubOrdinates();
    this.addToHistory(0);
  }

  private findEmployee(id: string | number): IEmployee | null {
    if(typeof id === 'string') {
      const employeeArray = Object.values(this.employees) as IEmployee[];
      const employee = employeeArray.find(employee => employee.name === id );
      return employee;
    } else {
      return this.employees[id]
    }
  }

  private addEmployee(name: string) {
    const newEmployee = new Employee(name);
    if(!this.employees[newEmployee.uniqueId]) {
      this.employees[newEmployee.uniqueId] = newEmployee
      this.state[newEmployee.uniqueId] = {
        subordinates: [],
        supervisor: null
      };
    }
  }

  private instantiateSubOrdinates() {
    subordinateTree.forEach(item => {
      const supervisor = this.findEmployee(item.supervisor)
      const employee = this.findEmployee(item.employee);

      if(supervisor && employee) {
        this.state[supervisor.uniqueId].subordinates.push(employee.uniqueId);
        supervisor.subordinates.push(employee);
        employee.supervisor = supervisor.uniqueId;
        this.state[employee.uniqueId].supervisor = supervisor.uniqueId;
      }
    })
  }

  private addToHistory(stateHash: string|number) {
    this.history = this.history.slice(0, this.historyIndex + 1);
    const _state = JSON.parse(JSON.stringify(this.state));

    this.history.push([stateHash, _state]);
    // this conditional prevent the history index from being set on initial app set up
    if(this.history.length > 1) {
      this.historyIndex++
    }
  }

  /**
   * @param data.employeeID number
   * @param data.supervisorID number
   * @param data.employeePreviousSupervisorID number
   * @param data.employeeSubordinates number[]
   * @param stateHash string
   * @returns void
   * if an action has been performed we add to the history 
   * if we undo the action we reduce the history index by 1 
   * and if another action  is performed we replace the action history
   * index from the current historyIndex
   */
  private setState (data: { 
    employeeID: number, 
    supervisorID: number, 
    employeePreviousSupervisorID: number,
    employeeSubordinates: number[]
  }, stateHash: string) {
    this.state[data.supervisorID].subordinates.push(data.employeeID);
    this.state[data.employeeID].supervisor = data.supervisorID;
    this.state[data.employeeID].subordinates = [];
    const subordinates = this.state[data.employeePreviousSupervisorID].subordinates;
    const filteredSubordinate = subordinates.filter(item => item !== data.employeeID);
    this.state[data.employeePreviousSupervisorID].subordinates = [...filteredSubordinate, ...data.employeeSubordinates];
    this.addToHistory(stateHash)
  }

  /**
   * 
   * @param history AppHistoryContent
   * @param currentAction string
   * @returns void
   */
  private reverseMoveAction(history: AppHistoryContent, currentAction: string){
    const state = history[1];
    const action = currentAction.split('-').map(i => +i);
    const employeeID = action[0]
    const supervisorID = action[1];
    const employeeState = state[employeeID];
    const employeeSupervisorID = employeeState.supervisor;
    const previousEmployeeSupervisorState = state[employeeSupervisorID];
    const supervisorState = state[supervisorID];

    const employee = this.findEmployee(employeeID);
    employee.supervisor = employeeSupervisorID;
    const employeeSubordinates:IEmployee[] = []
    employeeState.subordinates.forEach(subordinateID => {
      const subordinate = this.findEmployee(subordinateID);
      employeeSubordinates.push(subordinate);
    });
    employee.subordinates = employeeSubordinates;

    const superior = this.findEmployee(supervisorID);
    const superiorSubordinate: IEmployee[] = []
    supervisorState.subordinates.forEach(subordinateID => {
      const subordinate = this.findEmployee(subordinateID);
      superiorSubordinate.push(subordinate);
    })
    superior.subordinates = superiorSubordinate;

    const previousEmployeeSupervisor = this.findEmployee(employeeSupervisorID);
    const previousEmployeeSupervisorSubordinate: IEmployee[] = []
    previousEmployeeSupervisorState.subordinates.forEach(subordinateID => {
      const subordinate = this.findEmployee(subordinateID);
      previousEmployeeSupervisorSubordinate.push(subordinate);
    });
    previousEmployeeSupervisor.subordinates = previousEmployeeSupervisorSubordinate;
  }

  /**
   * @param employeeID: number
   * @param supervisorID: number
   * @returns void
   */
  move(employeeID: number, supervisorID: number) {
    //get employee and supervisor
    const supervisor = this.findEmployee(supervisorID)
    const employee = this.findEmployee(employeeID);

    //get employee subOrdinates
    const subOrdinates = employee.subordinates

    // find previous Superior
    const previousSupervisor = this.findEmployee(employee.supervisor);

    //move employee subordinates to previous superior
    previousSupervisor.subordinates = [...previousSupervisor.subordinates, ...subOrdinates];

    //set employee subordinates to empty
    employee.subordinates = [];

    //save current superior detail
    employee.supervisor = supervisor.uniqueId

    //push employee to superior
    supervisor.subordinates.push(employee);

    const stateHash = `${employeeID}-${supervisorID}`;
    this.setState({
      employeeID: employee.uniqueId,
      supervisorID: supervisor.uniqueId,
      employeePreviousSupervisorID: previousSupervisor.uniqueId,
      employeeSubordinates: subOrdinates.map(i => i.uniqueId)
    }, stateHash)
  };

  /**
   * undo move action
   */
  undo() {
    if(this.historyIndex) {
      const oldIndex = this.historyIndex;
      this.historyIndex = oldIndex - 1;
      const state = this.history[this.historyIndex];
      const currentState = this.history[oldIndex];
      const action = String(currentState[0]);
      this.reverseMoveAction(state, action);
    }
  }

  /**
   * redo move action
   */
  redo() {
    if((this.history.length - 1) > this.historyIndex) {
      this.historyIndex = this.historyIndex + 1;
      const state = this.history[this.historyIndex];
      const action = String(state[0]);
      this.reverseMoveAction(state, action);
    }
  }
}

const ceo = new Employee(Mark);
const app = new EmployeeOrgApp(ceo);

app.move(8, 5);
app.undo()
app.redo()
