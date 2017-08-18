/*global Vue, todoStorage */

(function (exports) {

	'use strict';

	var filters = {
		all: function (todos) {
			return todos;
		},
		active: function (todos) {
			return todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		completed: function (todos) {
			return todos.filter(function (todo) {
				return todo.completed;
			});
		},
    overdue: function (todos) {
      return todos.filter(function (todo) {
        return !todo.completed &&
          moment(todo.due).valueOf() < moment().valueOf();
      });
    }
	};

  var isValidDue = function (due) {
    return moment(due).isValid();
  }

  var timeNow = function () {
    return moment().format('YYYY-MM-DD HH:mm');
  }

	exports.app = new Vue({

		// the root element that will be compiled
		el: '.todoapp',

		// app initial state
		data: {
			todos: todoStorage.fetch(),
			newTodo: '',
      newTodoDue: timeNow(),
			editedTodo: null,
      editProp: '',
			visibility: 'all'
		},

		// watch todos change for localStorage persistence
		watch: {
			todos: {
				deep: true,
				handler: todoStorage.save
			}
		},

		// computed properties
		// http://vuejs.org/guide/computed.html
		computed: {
			filteredTodos: function () {
				return filters[this.visibility](this.todos);
			},
			remaining: function () {
				return filters.active(this.todos).length;
			},
			allDone: {
				get: function () {
					return this.remaining === 0;
				},
				set: function (value) {
					this.todos.forEach(function (todo) {
						todo.completed = value;
					});
				}
			}
		},

		// methods that implement data logic.
		// note there's no DOM manipulation here at all.
		methods: {

			pluralize: function (word, count) {
				return word + (count === 1 ? '' : 's');
			},

			addTodo: function () {
				var value = this.newTodo && this.newTodo.trim();
				if (!value) {
					return;
				}
        var due = isValidDue(this.newTodoDue) ? this.newTodoDue : timeNow();

				this.todos.push({
          title: value,
          completed: false,
          due: due,
        });
				this.newTodo = '';
        this.newTodoDue = timeNow();
			},

			removeTodo: function (todo) {
				var index = this.todos.indexOf(todo);
				this.todos.splice(index, 1);
			},

			editTodo: function (todo, prop) {
				this.beforeEditCache = todo.title;
        this.beforeEditDue = todo.due;
				this.editedTodo = todo;
        this.editProp = prop;
        this.visibility = 'all'; // FIXME: editing due date in "overdue" tab
                                 // can cause weird behavior because of
                                 // v-model
			},

			doneEdit: function (todo) {
				if (!this.editedTodo) {
					return;
				}
				this.editedTodo = null;
				todo.title = todo.title.trim();
        todo.due = todo.due.trim();
				if (!todo.title) {
					this.removeTodo(todo);
				}
        if (!isValidDue(todo.due)) {
          todo.due = this.beforeEditDue;
        }
			},

			cancelEdit: function (todo) {
				this.editedTodo = null;
				todo.title = this.beforeEditCache;
        todo.due = this.beforeEditDue;
			},

			removeCompleted: function () {
				this.todos = filters.active(this.todos);
			}
		},

		// a custom directive to wait for the DOM to be updated
		// before focusing on the input field.
		// http://vuejs.org/guide/custom-directive.html
		directives: {
			'todo-focus': function (el, binding) {
				if (binding.value) {
					el.focus();
				}
			}
		}
	});

})(window);
